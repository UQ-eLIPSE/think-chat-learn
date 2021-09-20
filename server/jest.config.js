module.exports = {
    verbose: true,
    preset: 'ts-jest',
    moduleFileExtensions: ["js", "ts"],
    testPathIgnorePatterns: ["/node_modules/"],
    roots: ["<rootDir>/tests"],
    testMatch: ["**/*.test.ts"],
    testEnvironment: "node"
};