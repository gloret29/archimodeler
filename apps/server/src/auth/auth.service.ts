import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findOne(email);
        if (!user) {
            console.log(`User not found: ${email}`);
            return null;
        }
        const isMatch = await bcrypt.compare(pass, user.password);
        console.log(`User found: ${email}, Password match: ${isMatch}`);
        if (isMatch) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = { username: user.email, sub: user.id, roles: user.roles.map((r: any) => r.name) };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }
}
