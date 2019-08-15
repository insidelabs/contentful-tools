module.exports = {
    testPathIgnorePatterns: ["__stubs__"],
    testEnvironment: 'node',
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
};
