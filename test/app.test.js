const request = require("supertest");
const app = require("../app");

describe("Wanderlust Application", () => {

    test("GET / should return 200", async () => {
        const response = await request(app)
            .get("/");

        expect(response.statusCode).toBe(200);
    });

    test("GET / should return root message", async () => {
        const response = await request(app)
            .get("/");

        expect(response.text).toContain("Hii,I am root");
    });

});