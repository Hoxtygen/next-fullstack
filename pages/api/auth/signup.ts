import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { NextApiRequest, NextApiResponse } from "next";
import { use } from "next-api-route-middleware";
import { allowMethods } from "middleware/allowedMethods";
import {
  knownPrismaError,
  validateUserObject,
  mapError,
  encryptPassword,
  generateToken,
} from "lib";
import { createUser, findUser } from "lib/db/user";
import { NewUser } from "typedef";

async function signup(req: NextApiRequest, res: NextApiResponse) {
  let { firstName, lastName, email, address, phoneNumber, password }: NewUser =
    req.body;

  const validation = validateUserObject(req.body);
  if (validation.error) {
    return res.status(400).json({
      status: 400,
      error: mapError(validation.error),
    });
  }
  email = email.toLowerCase();

  try {
    const result = await createUser({
      email,
      firstName,
      lastName,
      address,
      phoneNumber,
      password: encryptPassword(password),
    });

    const token = await generateToken({ id: result.id, email: email });

    return res.status(201).json({
      status: 201,
      message: "User created successfully",
      data: {
        token,
        user: {
          email: result.email,
          name: `${result.firstName}  ${result.lastName}`,
        },
      },
    });
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      return knownPrismaError(res, error);
    }
    return res
      .status(res.statusCode)
      .json({ message: "Failed to create user", error });
  }
}

export default use(allowMethods(["POST"]), signup);
