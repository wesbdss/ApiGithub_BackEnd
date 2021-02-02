const request = require("supertest");
const app = require('./app')



describe("API Tests gerais", () => {
    test("Resposta em /api", () => {
        return request(app)
            .get("/api")
            .then(response => {
                expect(response.statusCode).toBe(200);
            });
    });

    test("Procurar meu usuário mas sem /user", () => {
        return request(app)
            .get("/api/wesbdss")
            .then(response => {
                expect(response.statusCode).toBe(404);
            });
    });

    test("Enviar parametros /user", () => {
        return request(app)
            .get("/api/wesbdss?since=2")
            .then(response => {
                expect(response.statusCode).toBe(404);
            });
    });

});


describe("API Tests route /api/users/?since=:number", () => {
    test("Get em /api/users?since=1", () => {
        return request(app)
            .get("/api/users?since=1")
            .then(response => {
                expect(response.statusCode).toBe(200);
            });
    });



   

    test("Teste do per_page em /api/users?since=0&per_page=5", async () => {
        const response = await request(app).get("/api/users?since=0&per_page=5");
        expect(response.statusCode).toBe(200);
        expect( await response.body.response.length).toBe(5);
    });

    test("Teste do since negativo /api/users?since=-1&per_page=5", async () => {
        const response = await request(app).get("/api/users?since=-1&per_page=5");
        expect(response.statusCode).toBe(400);
        expect( await response.body.message).toBe("parameter since incorrect");
    });
    
    test("Teste do per_page negativo /api/users?since=0&per_page=-1", async () => {
        const response = await request(app).get("/api/users?since=0&per_page=-1");
        expect(response.statusCode).toBe(400);
        expect( await response.body.message).toBe("parameter per_page incorrect");
    });

    test("Teste do since não numeral /api/users?since=dsadsaasd&per_page=0", async () => {
        const response = await request(app).get("/api/users?since=dsadsaasd&per_page=0");
        expect(response.statusCode).toBe(400);
        expect( await response.body.message).toBe("parameter since incorrect");
    });

    test("Teste do per_page não numeral /api/users?since=1&per_page=asduiahsud", async () => {
        const response = await request(app).get("/api/users?since=0&per_page=asdsdadsadsa");
        expect(response.statusCode).toBe(400);
        expect( await response.body.message).toBe("parameter per_page incorrect");
    });

});


describe("API Tests route /api/users/:username/details", () => {
    test("Teste do username nulo", async () => {
        const response = await request(app).get("/api/users/details");
        expect(response.statusCode).toBe(404);
    });

    test("Teste do meu username ", async () => {
        const response = await request(app).get("/api/users/wesbdss/details");
        expect(response.statusCode).toBe(200);
    });

});

describe("API Tests route /api/users/:username/repos", () => {
    test("Teste do username nulo", async () => {
        const response = await request(app).get("/api/users/repos");
        expect(response.statusCode).toBe(404);
    });

    test("Teste do meu username ", async () => {
        const response = await request(app).get("/api/users/wesbdss/repos");
        expect(response.statusCode).toBe(200);
    });

});