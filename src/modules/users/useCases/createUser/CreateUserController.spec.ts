import request from "supertest";
import { Connection, createConnection } from "typeorm";
import { app } from "../../../../app";
import { CreateUserError } from "./CreateUserError";

let connection: Connection;
describe("Create user", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be able to create a new user", async () => {
    const response = await request(app).post("/api/v1/users").send({
      name: "Ruby Morton",
      email: "jucba@put.ad",
      password: "test123",
    });

    expect(response.status).toBe(201);
  });

  it("should not be able to create a new user if user already exists", async () => {
    await expect(
      request(app).post("/api/v1/users").send({
        name: "Ruby Morton",
        email: "jucba@put.ad",
        password: "test123",
      })
    ).resolves.toHaveProperty("status", new CreateUserError().statusCode);
  });
});
