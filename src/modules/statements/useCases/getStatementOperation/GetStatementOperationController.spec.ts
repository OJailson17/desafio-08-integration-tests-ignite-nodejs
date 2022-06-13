import { hash } from "bcryptjs";
import request from "supertest";
import { v4 as uuidV4 } from "uuid";
import { Connection, createConnection } from "typeorm";
import { app } from "../../../../app";
import { GetStatementOperationError } from "./GetStatementOperationError";
import { AppError } from "../../../../shared/errors/AppError";
import { JWTInvalidTokenError } from "../../../../shared/errors/JWTInvalidTokenError";
import { JWTTokenMissingError } from "../../../../shared/errors/JWTTokenMissingError";

let connection: Connection;
describe("Get Statement", () => {
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

  it("should be able to get a statement", async () => {
    const responseAuth = await request(app).post("/api/v1/sessions").send({
      email: "admin@rentalx.com",
      password: "admin",
    });

    const { token } = responseAuth.body;

    const responseStatement = await request(app)
      .post("/api/v1/statements/deposit")
      .send({
        amount: 200,
        description: "new deposit",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    const { id } = responseStatement.body;

    const response = await request(app)
      .get(`/api/v1/statements/${id}`)
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
  });

  it("should not be able to make a statement if statement id does not exist", async () => {
    const responseAuth = await request(app).post("/api/v1/sessions").send({
      email: "admin@rentalx.com",
      password: "admin",
    });

    const { token } = responseAuth.body;

    await expect(
      request(app)
        .get(`/api/v1/statements/${uuidV4()}`)
        .set({
          Authorization: `Bearer ${token}`,
        })
    ).resolves.toHaveProperty(
      "status",
      new GetStatementOperationError.StatementNotFound().statusCode
    );
  });

  it("should not be able to make a statement if user id does not exist", async () => {
    await expect(
      request(app).get(`/api/v1/statements/${uuidV4()}`).set({
        Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiOGRiYmZhN2MtMjJhZS00YmY2LWIxY2UtYmMwNGQ3OTU2ZTI1IiwibmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkByZW50YWx4LmNvbSIsInBhc3N3b3JkIjoiJDJhJDA4JGZZMkcvd1NYNENVUWZzeG1PLmdkUGVTemdpbHN2MGY2OGVRQTVJM053bWFVRU1GdUw1c3ZpIiwiY3JlYXRlZF9hdCI6IjIwMjItMDYtMDVUMDM6MjE6NDMuMTM4WiIsInVwZGF0ZWRfYXQiOiIyMDIyLTA2LTA1VDAzOjIxOjQzLjEzOFoifSwiaWF0IjoxNjU0Mzk5MzAzLCJleHAiOjE2NTQ0ODU3MDMsInN1YiI6IjhkYmJmYTdjLTIyYWUtNGJmNi1iMWNlLWJjMDRkNzk1NmUyNSJ9.HnJiMtl1R5oiPkfydP76NCkBGKQW0485kVz-BPErzd8`,
      })
    ).resolves.toHaveProperty(
      "status",
      new GetStatementOperationError.UserNotFound().statusCode
    );
  });

  it("should not be able to make a statement token is missing", async () => {
    const responseAuth = await request(app).post("/api/v1/sessions").send({
      email: "admin@rentalx.com",
      password: "admin",
    });

    const { token } = responseAuth.body;

    await expect(
      request(app).get(`/api/v1/statements/${uuidV4()}`)
    ).resolves.toHaveProperty("status", new JWTTokenMissingError().statusCode);
  });

  it("should not be able to make a statement if token is invalid", async () => {
    await expect(
      request(app)
        .get(`/api/v1/statements/${uuidV4()}`)
        .set({
          Authorization: `Bearer ${uuidV4()}`,
        })
    ).resolves.toHaveProperty("status", new JWTInvalidTokenError().statusCode);
  });
});
