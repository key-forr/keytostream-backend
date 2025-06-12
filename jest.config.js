module.exports = {
	moduleFileExtensions: ['js', 'json', 'ts', 'tsx'],

	rootDir: '.',
	testRegex: '.*\\.spec\\.ts$',
	transform: {
		'^.+\\.(ts|tsx)$': 'ts-jest'
	},

	collectCoverageFrom: ['**/*.(t|j)s', '**/*.tsx'],

	coverageDirectory: '../coverage',
	testEnvironment: 'node',
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/$1',
		'^@prisma/generated$': '<rootDir>/prisma/generated',
		'^@prisma/generated/(.*)$': '<rootDir>/prisma/generated/$1'
	},
	testPathIgnorePatterns: ['/node_modules/', '/dist/'],
	coveragePathIgnorePatterns: ['/node_modules/', '/dist/', '/test/']
}
