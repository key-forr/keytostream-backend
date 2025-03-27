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

export function VerifyChannelTemplate() {
	return (
		<Html>
		    <Head />
	        <Preview>Ваш канал верифіковано</Preview>
	        <Tailwind>
		        <Body className='max-w-2xl mx-auto p-6 bg-slate-50'>
					<Section className="text-center mb-8">
						<Heading className="text-3xl text-black font-bold">
							Вітаємо! Ваш канал верифіковано
						</Heading>
						<Text className="text-black text-base mt-2">
							Ми раді повідомити, що ваш канал тепер верифіковано, і ви отримали офіційний значок.
						</Text>
					</Section>

					<Section className="bg-white rounded-lg shadow-md p-6 text-center mb-6">
						<Heading className="text-2xl text-black font-semibold">
							Що це означає?
						</Heading>
						<Text className="text-base text-black mt-2">
							Значок верифікації підтверджує автентичність вашого каналу та підвищує довіру глядачів.
						</Text>
					</Section>

					<Section className="text-center mt-8">
						<Text className="text-gray-600">
							Якщо у вас є питання, напишіть нам на{' '}
							<Link
								href="mailto:help@keytostream.com"
								className="text-[#18b9ae] underline"
							>
								help@teastream.ru
							</Link>.
						</Text>
					</Section>
		        </Body>
	        </Tailwind>
        </Html>
	)
}
