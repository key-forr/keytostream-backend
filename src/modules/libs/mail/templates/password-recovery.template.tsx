import { Body, Head, Heading, Link, Preview, Section, Tailwind, Text } from '@react-email/components'
import { Html } from '@react-email/html'
import * as React from 'react'

import type { SessionMetadata } from '@/src/shared/types/session-metadata.types'

interface PasswordRecoveryTemplateProps {
    domain: string
    token: string
    metadata: SessionMetadata
}

export function PasswordRecoveryTemplate({ domain, token, metadata}: PasswordRecoveryTemplateProps) {
    const resetLink = `${domain}/account/recovery/${token}`
    
    return ( <Html>
        <Head/>
        <Preview>Скидання пароля</Preview>
        <Tailwind>
            <Body className='max-w-2xl mx-auto p-6 bg-slate-50'>
                <Section className='text-center mb-8'>
                    <Heading className='text-3xl text-black font-bold'>
                        Скидання пароля
                    </Heading> 
                    <Text className='text-black text-base mt-2'>
                       Ви запросили скидання пароля для вашого облікового запису.
                    </Text>
                    <Text className='text-black text-base mt-2'>
                       Щоб створити новий пароль, нажміть на силку нижче:
                    </Text>
                    <Link href={resetLink} className='inline-flex
                        justify-center items-center rounded-full text-sm
                        font-medium text-white bg-[#18B9AE] px-5 py-2'>
                        Скинути пароль
                    </Link>
                </Section>

                <Section className='bg-gray-100 rounded-lg p-6 mb-6'>
                    <Heading className='text-xl font-semibold text-[#18B9AE]'>
                        Інформація про запит:
                    </Heading>

                    <ul className="list-disc list-inside text-black mt-2">
						<li>🌍 Місцезнаходження: {metadata.location.country}, {metadata.location.city}</li>
						<li>📱 Операційна система: {metadata.device.os}</li>
						<li>🌐 Браузер: {metadata.device.browser}</li>
						<li>💻 IP-адрес: {metadata.ip}</li>
					</ul>
					<Text className='text-gray-600 mt-2'>
						Якщо ви не ініціалізували даний запит, будь ласка, ігноруйте дане повідомлення.
					</Text>
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
    </Html>
    )
}