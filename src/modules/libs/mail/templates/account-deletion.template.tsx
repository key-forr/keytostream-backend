import {
	Body,
	Head,
	Heading,
	Html,
	Link,
	Preview,
	Section,
	Tailwind,
	Text
} from '@react-email/components';
import * as React from 'react';

interface AccountDeletionTemplateProps {
	domain: string
}

export function AccountDeletionTemplate({ domain }:AccountDeletionTemplateProps) {
	const registerLink = `${domain}/account/create`

	return (
		<Html>
		    <Head />
	        <Preview>Аккаунт видалений</Preview>
	        <Tailwind>
		        <Body className='max-w-2xl mx-auto p-6 bg-slate-50'>
					<Section className="text-center">
						<Heading className="text-3xl text-black font-bold">
							Ваш аккаунт був повністю видалений
						</Heading>
						<Text className="text-base text-black mt-2">
							Ваш аккаунт був повністю стертий з бази даних keytostream. Всі ваші дані і інформація була видалена без можливості повернути.
						</Text>
					</Section>

					<Section className="bg-white text-black text-center rounded-lg shadow-md p-6 mb-4">
						<Text>
							Ви більше не будете получати повідомлення в Telegram і на пошту.
						</Text>
						<Text>
							Якщо ви хочете вернутися на платформу, ви можете зареєструватись по силці:
						</Text>
						<Link
							href={registerLink}
							className="inline-flex justify-center items-center rounded-md mt-2 text-sm font-medium text-white bg-[#18B9AE] px-5 py-2 rounded-full"
						>
							Зареєструватись в keytostream
						</Link>
					</Section>

					<Section className="text-center text-black">
						<Text>
							Дякую, що були з нами! Ми завжди будем раді бачити вас на платформі.
						</Text>
					</Section>
		        </Body>
	        </Tailwind>
        </Html>
	)
}
