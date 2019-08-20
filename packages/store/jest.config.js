module.exports = {
    testPathIgnorePatterns: ["lib", "__stubs__"],
    coveragePathIgnorePatterns: ["__stubs__"],
    testEnvironment: 'node',
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
};
