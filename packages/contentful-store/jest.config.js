module.exports = {
    testPathIgnorePatterns: ["__stubs__", "dist"],
    testEnvironment: 'node',
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
};
