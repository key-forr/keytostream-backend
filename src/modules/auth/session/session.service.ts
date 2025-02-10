import {
	Injectable,
	InternalServerErrorException,
	NotFoundException,
	UnauthorizedException
} from '@nestjs/common'
import { verify } from 'argon2'
import type { Request } from 'express'

import { PrismaService } from '@/src/core/prisma/prisma.service'

import { LoginInput } from './inputs/login.input'

@Injectable()
export class SessionService {
	public constructor(private readonly prismaService: PrismaService) {}

	public async login(req: Request, input: LoginInput) {
		const { login, password } = input

		const user = await this.prismaService.user.findFirst({
			where: {
				OR: [
					{ username: { equals: login } },
					{ email: { equals: login } }
				]
			}
		})

		if (!user) {
			throw new NotFoundException('Користувач не найдений')
		}

		const isValidPassword = await verify(user.password, password)

		if (!isValidPassword) {
			throw new UnauthorizedException('Не вірний пароль')
		}

		return new Promise((resolve, reject) => {
			req.session.createdAt = new Date()
			req.session.userId = user.id

			req.session.save(err => {
				if (err) {
					return reject(
						new InternalServerErrorException(
							'Не вдалось зберегти сесію'
						)
					)
				}

				resolve({ user })
			})
		})
	}

	public async logout() {}
}
