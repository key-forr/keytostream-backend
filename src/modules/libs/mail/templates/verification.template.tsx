import { Body, Head, Heading, Link, Preview, Section, Tailwind, Text } from '@react-email/components'
import { Html } from '@react-email/html'
import * as React from 'react'

interface VerificationTemplateProps {
	domain: string
	token: string
}

export function VerificationTemplate({
	domain,
	token
}: VerificationTemplateProps) {
	const verificationLink = `${domain}/account/verify?token=${token}`

	return (<Html>
        <Head/>
        <Preview>Верифікація аккаунта</Preview>
        <Tailwind>
            <Body className='max-w-2xl mx-auto p-6 bg-slate-50'>
                <Section className='text-center mb-8'>
                    <Heading className='text-3xl text-black font-bold'>
                        Підтвердження вашої пошти
                    </Heading>
                    <Text>
                        Дякую за реєстрацію в keytostream! Щоб
                        підтвердити свою електронну пошту, будь ласка,
                        перейдіть по силці:
                    </Text>
                    <Link href={verificationLink} className='inline-flex
                    justify-center items-center rounded-full text-sm
                    font-medium text-white bg-[#18B9AE] px-5 py-2'>
                        Підтвердіть пошту
                    </Link>
                </Section>
                
                <Section className='text-center mt-8'>
                    <Text className='text-gray-600'>
                        Якщо у вас є питання або ви зіштовхлись з
                        труднощами, не соромтесь звертатись в нашу службу
                        підтримки по адресу{' '}
                        <Link
                            href='mailto:key.forr1@gmail.com'
                            className='text-[#18b9ae] underline'
                        >
                            key.forr1@gmail.com
                        </Link>.
                    </Text>
                </Section>
            </Body>
        </Tailwind>
    </Html>)
}
