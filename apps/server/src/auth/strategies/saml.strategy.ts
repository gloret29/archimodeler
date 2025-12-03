import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-saml';

@Injectable()
export class SamlStrategy extends PassportStrategy(Strategy, 'saml') {
    constructor() {
        // Configuration SAML via variables d'environnement
        // Par défaut, utilise les valeurs de développement si non définies
        const frontendUrl = process.env.FRONTEND_URL || process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
        const samlEntryPoint = process.env.SAML_ENTRY_POINT || 'http://localhost:8080/simplesaml/saml2/idp/SSOService.php';
        const samlCert = process.env.SAML_CERT || 'fake-cert'; // TODO: Configure with real IdP certificate
        
        super({
            issuer: frontendUrl,
            callbackUrl: `${frontendUrl}/auth/saml/callback`,
            entryPoint: samlEntryPoint,
            cert: samlCert,
        });
    }

    async validate(profile: any) {
        return {
            userId: profile.nameID,
            email: profile.email,
            roles: profile.roles,
        };
    }
}
