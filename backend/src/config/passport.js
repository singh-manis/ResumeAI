import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// In standard JWT implementations without session cookies, 
// serializeUser and deserializeUser aren't heavily used, but are 
// required by passport if using sessions. We'll set them up minimally.
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await prisma.user.findUnique({ where: { id } });
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn('⚠️  GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing. Google OAuth will not work.');
}

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID || 'dummy_client_id',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_client_secret',
            callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3002/api/oauth/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // 1. Check if user exists by googleId
                let user = await prisma.user.findUnique({
                    where: { googleId: profile.id },
                });

                if (user) {
                    return done(null, user);
                }

                // 2. Check if a user exists with the same email
                const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
                if (!email) {
                    return done(new Error('No email found from Google profile'), false);
                }

                user = await prisma.user.findUnique({
                    where: { email: email },
                });

                if (user) {
                    // Link the Google account to the existing email account
                    user = await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            googleId: profile.id,
                            authProvider: 'GOOGLE', // Update to GOOGLE 
                            avatar: user.avatar || profile.photos[0]?.value, // Don't overwrite existing avatar
                        },
                    });
                    return done(null, user);
                }

                // 3. Create a new user
                user = await prisma.user.create({
                    data: {
                        googleId: profile.id,
                        authProvider: 'GOOGLE',
                        email: email,
                        firstName: profile.name?.givenName || 'User',
                        lastName: profile.name?.familyName || '',
                        avatar: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null,
                        role: 'CANDIDATE', // Default role
                        isVerified: true, // Google emails are verified
                    },
                });

                return done(null, user);

            } catch (error) {
                console.error('Google OAuth Error:', error);
                return done(error, false);
            }
        }
    )
);

export default passport;
