import {
	type ValidationArguments,
	ValidatorConstraint,
	type ValidatorConstraintInterface
} from 'class-validator'

import { NewPasswordInput } from '@/src/modules/auth/password-recovery/inputs/new-password.input'

@ValidatorConstraint({ name: 'IsPasswordsMatching', async: false })
export class IsPasswordsMatchingConstraint
	implements ValidatorConstraintInterface
{
	public validate(passwordRepeat: string, args: ValidationArguments) {
		const object = args.object as NewPasswordInput

		return object.password === passwordRepeat
	}

	public defaultMessage(validationArguments?: ValidationArguments) {
		return 'Паролі не співпадають'
	}
}
