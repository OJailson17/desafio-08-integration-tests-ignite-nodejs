import { Connection, createConnection } from "typeorm";
import request from "supertest";
import { v4 as uuidV4 } from "uuid";
import { app } from "../../../../app";
import { hash } from "bcryptjs";
import { IncorrectEmailOrPasswordError } from "./IncorrectEmailOrPasswordError";

let connection: Connection;
describe("Authenticate User", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    const id = uuidV4();
    const password = await hash("admin", 8);

    await connection.query(
      `INSERT INTO USERS(id, name, email, password, created_at, updated_at )
        values('${id}', 'admin', 'admin@rentalx.com', '${password}','now()', 'now()' )
      `
    );
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be able to authenticate a user", async () => {
    const response = await request(app).post("/api/v1/sessions").send({
      email: "admin@rentalx.com",
      password: "admin",
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");
  });

  it("should not be able to authenticate a user if email is incorrect", async () => {
    await expect(
      request(app).post("/api/v1/sessions").send({
        email: "admin@rental.com",
        password: "admin",
      })
    ).resolves.toHaveProperty(
      "status",
      new IncorrectEmailOrPasswordError().statusCode
    );
  });

  it("should not be able to authenticate a user if password is incorrect", async () => {
    await expect(
      request(app).post("/api/v1/sessions").send({
        email: "admin@rentalx.com",
        password: "admin123",
      })
    ).resolves.toHaveProperty(
      "status",
      new IncorrectEmailOrPasswordError().statusCode
    );
  });
});
