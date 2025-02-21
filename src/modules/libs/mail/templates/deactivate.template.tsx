import type { SessionMetadata } from "@/src/shared/types/session-metadata.types"
import { Body, Head, Heading, Link, Preview, Section, Tailwind, Text } from '@react-email/components'
import { Html } from '@react-email/html'
import * as React from "react"

interface DeactivateTemplateProps {
    token:string
    metadata: SessionMetadata
}

export function DeactivateTemplate({ token, metadata }: DeactivateTemplateProps) {
    return ( 
        <Html>
            <Head/>
            <Preview>Деактивація аккаунта</Preview>
            <Tailwind>
                <Body className='max-w-2xl mx-auto p-6 bg-slate-50'>
                    <Section className='text-center mb-8'>
                        <Heading className='text-3xl text-black font-bold'>
                            Запит на деактивацію аккаунта
                        </Heading> 
                        <Text className='text-black text-base mt-2'>
                            Ви ініціалізували процес деактивації свого аккаунта
                            не платформі <b>keytostream</b>
                        </Text>
                    </Section>

                    <Section className='bg-gray-100 rounded-lg p-6
                    text-center mb-6'>
                        <Heading className='text-2xl text-black font-semibold'>
                            Код підтвердження:
                        </Heading>
                        <Heading className='text-3xl text-black font-semibold'>
                            {token}
                        </Heading>
                        <Text className='text-black'>
                            Цей код дійсний протягом 5 хвилин.
                        </Text>
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