import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-saml';

@Injectable()
export class SamlStrategy extends PassportStrategy(Strategy, 'saml') {
    constructor() {
        super({
            issuer: 'http://localhost:3000',
            callbackUrl: 'http://localhost:3000/auth/saml/callback',
            entryPoint: 'http://localhost:8080/simplesaml/saml2/idp/SSOService.php',
            cert: 'fake-cert', // TODO: Configure with real IdP certificate
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
