import { Express } from "express";
import request from "supertest";
import { setupTestEnvironment, teardownTestEnvironment } from "./setup";
import mongoose from "mongoose";

describe("GraphQL Integration Tests for User Schema", () => {
  let app: Express;

  beforeAll(async () => {
    app = await setupTestEnvironment();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  async function loginAndGetToken(email, password) {
    const loginMutation = `
      mutation {
        login(email: "${email}", password: "${password}") {
          access_token
        }
      }
    `;
    const loginResponse = await request(app)
      .post("/graphql")
      .send({ query: loginMutation });

    return loginResponse.body.data.login.access_token;
  }

  async function performMutation(token, mutation, variables) {
    return request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${token}`)
      .send({ query: mutation, variables });
  }

  async function getIdByType(type: string) {
    const queries = {
      experiences: `
        query GetAllUsers {
          getAllUsers {
            _id
            profile {
              experiences {
                _id
              }
            }
          }
        }
      `,
      licenses: `
        query GetAllUsers {
          getAllUsers {
            _id
            profile {
              licenses {
                _id
              }
            }
          }
        }
      `,
      education: `
        query GetAllUsers {
          getAllUsers {
            _id
            profile {
              education {
                _id
              }
            }
          }
        }
      `,
    };

    const query = queries[type];

    if (!query) {
      throw new Error(`Invalid type specified: ${type}`);
    }

    const response = await request(app).post("/graphql").send({ query });

    return response.body.data.getAllUsers[0].profile[
      type === "experiences" ? "experiences" : type
    ].length > 0
      ? response.body.data.getAllUsers[0].profile[
          type === "experiences" ? "experiences" : type
        ][0]._id
      : null;
  }

  it("should register a new user successfully", async () => {
    const mutation = `
      mutation {
        register(input: {
          username: "newuser",
          avatar: "http://example.com/avatar.png",
          fullName: "New User",
          email: "newuser@example.com",
          password: "StrongPassword123"
        }) {
          _id
          username
          email
        }
      }
    `;

    const response = await request(app)
      .post("/graphql")
      .send({ query: mutation });
    expect(response.status).toBe(200);
    expect(response.body.data.register).toBeDefined();
    expect(response.body.data.register.email).toBe("newuser@example.com");
  });

  it("should fail to register with an invalid email format", async () => {
    const mutation = `
      mutation {
        register(input: {
          username: "invalidemailuser",
          avatar: "http://example.com/avatar.png",
          fullName: "Invalid Email User",
          email: "invalid-email-format",
          password: "StrongPassword123"
        }) {
          _id
          username
          email
        }
      }
    `;

    const response = await request(app)
      .post("/graphql")
      .send({ query: mutation });
    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toBe(
      "Registration failed: Invalid email format.",
    );
  });

  it("should fail to register with missing required fields", async () => {
    const mutation = `
      mutation {
        register(input: {
          username: "",
          avatar: "http://example.com/avatar.png",
          fullName: "",
          email: "hello@mail.com",
          password: "StrongPassword123"
        }) {
          _id
          username
          email
        }
      }
    `;

    const response = await request(app)
      .post("/graphql")
      .send({ query: mutation });
    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toBe(
      "Registration failed: All fields are required.",
    );
  });

  it("should assign avatar with empty string if not inputted", async () => {
    const mutation = `
      mutation {
        register(input: {
          username: "qwertyuiop",
          fullName: "hello user",
          email: "hello@mail.com",
          password: "StrongPassword123"
        }) {
          _id
          username
          email
          avatar
        }
      }
    `;

    const response = await request(app)
      .post("/graphql")
      .send({ query: mutation });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.register.avatar).toBe("");
  });

  it("should fail to register with a duplicate email", async () => {
    await request(app)
      .post("/graphql")
      .send({
        query: `
        mutation {
          register(input: {
            username: "duplicateEmailUser",
            avatar: "http://example.com/avatar.png",
            fullName: "Duplicate Email User",
            email: "duplicate@example.com",
            password: "StrongPassword123"
          }) {
            _id
          }
        }
      `,
      });

    const mutation = `
      mutation {
        register(input: {
          username: "newuser2",
          avatar: "http://example.com/avatar2.png",
          fullName: "New User 2",
          email: "duplicate@example.com",
          password: "StrongPassword123"
        }) {
          _id
          username
          email
        }
      }
    `;

    const response = await request(app)
      .post("/graphql")
      .send({ query: mutation });
    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toBe(
      "Registration failed: Email already in use.",
    );
  });

  it("should fail to register with a duplicate username", async () => {
    await request(app)
      .post("/graphql")
      .send({
        query: `
        mutation {
          register(input: {
            username: "duplicateUsername",
            avatar: "http://example.com/avatar.png",
            fullName: "Duplicate Username",
            email: "unique@example.com",
            password: "StrongPassword123"
          }) {
            _id
          }
        }
      `,
      });

    const mutation = `
      mutation {
        register(input: {
          username: "duplicateUsername",
          avatar: "http://example.com/avatar2.png",
          fullName: "New User with Duplicate Username",
          email: "newunique@example.com",
          password: "StrongPassword123"
        }) {
          _id
          username
          email
        }
      }
    `;

    const response = await request(app)
      .post("/graphql")
      .send({ query: mutation });
    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toBe(
      "Registration failed: Username is already taken.",
    );
  });

  it("should fail to register with a weak password", async () => {
    const mutation = `
      mutation {
        register(input: {
          username: "weakpassworduser",
          avatar: "http://example.com/avatar.png",
          fullName: "Weak Password User",
          email: "weakpassword@example.com",
          password: "1234"
        }) {
          _id
          username
          email
        }
      }
    `;

    const response = await request(app)
      .post("/graphql")
      .send({ query: mutation });
    const passwordErrorMessages = [
      "Password must be at least 8 characters long.",
      "Password must contain at least one uppercase letter.",
      "Password must contain at least one number.",
    ];
    const errorMessages = response.body.errors.map((err) => err.message);

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(
      passwordErrorMessages.some((msg) => errorMessages.includes(msg)),
    ).toBe(false);
  });

  it("should login an existing user", async () => {
    const mutation = `
      mutation {
        login(email: "newuser@example.com", password: "StrongPassword123") {
          access_token
          userId
          username
          email
        }
      }
    `;

    const response = await request(app)
      .post("/graphql")
      .send({ query: mutation });
    expect(response.status).toBe(200);
    expect(response.body.data.login).toBeDefined();
    expect(response.body.data.login.email).toBe("newuser@example.com");
    expect(response.body.data.login.access_token).toBeTruthy();
  });

  it("should fail to login", async () => {
    const mutation = `
      mutation {
        login(email: "new@example.com", password: "StrongPassword123") {
          access_token
          userId
          username
          email
        }
      }
    `;

    const response = await request(app)
      .post("/graphql")
      .send({ query: mutation });
    expect(response.status).toBe(200);
    expect(response.body.errors[0].message).toBe(
      "Login failed: Invalid Email/Password",
    );
  });

  it("should fetch a user by ID", async () => {
    const getUserQuery = `
      query GetAllUsers {
        getAllUsers {
          _id
          username
          avatar
          fullName
          email
          password
          isOnline
          createdAt
          updatedAt
        }
      }
    `;

    const getUsersResponse = await request(app)
      .post("/graphql")
      .send({ query: getUserQuery });

    const userId = getUsersResponse.body.data.getAllUsers[0]._id;

    const query = `
      query {
        getUserById(userId: "${userId}") {
          _id
          username
          fullName
          email
        }
      }
    `;

    const response = await request(app).post("/graphql").send({ query });
    expect(response.status).toBe(200);
    expect(response.body.data.getUserById).toMatchObject({
      username: "newuser",
      fullName: "New User",
      email: "newuser@example.com",
    });
  });

  it("should fetch users by keyword search", async () => {
    const keyword = "newuser";
    const searchQuery = `
      query GetAllUsers($keyword: String) {
        getAllUsers(keyword: $keyword) {
          _id
          username
          fullName
          email
        }
      }
    `;

    const response = await request(app)
      .post("/graphql")
      .send({ query: searchQuery, variables: { keyword } });

    expect(response.status).toBe(200);

    const coba = response.body.data.getAllUsers;
    expect(coba).toHaveLength(1);

    expect(coba[0]).toMatchObject({
      username: expect.stringContaining("newuser"),
      fullName: "New User",
      email: expect.stringContaining("newuser"),
    });
  });

  it("should return all users when no keyword is provided", async () => {
    const searchQuery = `
      query GetAllUsers {
        getAllUsers {
          _id
          username
          fullName
          email
        }
      }
    `;

    const response = await request(app)
      .post("/graphql")
      .send({ query: searchQuery });

    expect(response.status).toBe(200);
    expect(response.body.data.getAllUsers.length).toBeGreaterThan(0);
  });

  it("should fail to fetch a user by invalid ID", async () => {
    const invalidUserId = "nonexistentUserId123";

    const query = `
      query {
        getUserById(userId: "${invalidUserId}") {
          _id
          username
          fullName
          email
        }
      }
    `;

    const response = await request(app).post("/graphql").send({ query });
    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toContain("User id is invalid");
  });

  it("should return an error for a valid ObjectId with no matching user", async () => {
    const validButNonexistentUserId = new mongoose.Types.ObjectId().toString();

    const query = `
      query {
        getUserById(userId: "${validButNonexistentUserId}") {
          _id
          username
          fullName
          email
        }
      }
    `;

    const response = await request(app).post("/graphql").send({ query });
    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toContain("No User Found");
  });

  it("should return all user's data", async () => {
    const query = `
      query GetAllUsers {
        getAllUsers {
          _id
          username
          avatar
          fullName
          email
          password
          isOnline
          createdAt
          updatedAt
        }
      }
    `;

    const response = await request(app).post("/graphql").send({ query });
    const usernames = response.body.data.getAllUsers.map((user) => ({
      username: user.username,
    }));

    expect(response.status).toBe(200);
    expect(usernames).toEqual(
      expect.arrayContaining([
        { username: "newuser" },
        { username: "qwertyuiop" },
        { username: "duplicateEmailUser" },
        { username: "duplicateUsername" },
      ]),
    );
  });

  describe("User Profile Bio, Location, and JobPrefs Mutations", () => {
    let token: string;

    beforeAll(async () => {
      token = await loginAndGetToken(
        "newuser@example.com",
        "StrongPassword123",
      );
    });

    it("should update a user’s bio", async () => {
      const updateBioMutation = `
          mutation UpdateBio($bio: String) {
            updateBio(bio: $bio) {
                bio
            }
        }
        `;

      const response = await performMutation(token, updateBioMutation, {
        bio: "Updated Bio",
      });

      expect(response.status).toBe(200);
      expect(response.body.data.updateBio.bio).toBe("Updated Bio");
    });

    it("should failed updating bio when no token detected", async () => {
      const updateBioMutation = `
            mutation {
                updateBio(bio: "Updated Bio") {
                    bio
                }
            }
            `;

      const response = await request(app)
        .post("/graphql")
        .set("Authorization", `Bearer `)
        .send({ query: updateBioMutation });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe(
        "Update Failed: Invalid Token",
      );
    });

    it("should update a user’s location", async () => {
      const updateLocationMutation = `
          mutation {
            updateLocation(location: "Updated Location") {
              location
            }
          }
        `;

      const response = await performMutation(token, updateLocationMutation, {
        location: "Updated Location",
      });

      expect(response.status).toBe(200);
      expect(response.body.data.updateLocation.location).toBe(
        "Updated Location",
      );
    });

    it("should fail updating a user’s location when no token detected", async () => {
      const updateLocationMutation = `
          mutation {
            updateLocation(location: "Updated Location") {
              location
            }
          }
        `;

      const response = await request(app)
        .post("/graphql")
        .set("Authorization", `Bearer `)
        .send({ query: updateLocationMutation });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe(
        "Update Failed: Invalid Token",
      );
    });

    it("should update a user’s job preferences", async () => {
      const jobPrefs = ["Software Development", "UI/UX Design"];
      const updateJobPrefsMutation = `
          mutation UpdateJobPrefs($jobPrefs: [String]) {
            updateJobPrefs(jobPrefs: $jobPrefs) {
                _id
                jobPrefs
            }
        }
        `;

      const response = await performMutation(token, updateJobPrefsMutation, {
        jobPrefs,
      });

      expect(response.status).toBe(200);
      expect(response.body.data.updateJobPrefs.jobPrefs).toEqual(jobPrefs);
    });

    it("should fail to update a user’s job preferences", async () => {
      const updateJobPrefsMutation = `
          mutation UpdateJobPrefs($jobPrefs: [String!]) {
            updateJobPrefs(jobPrefs: $jobPrefs) {
                _id
                jobPrefs
            }
        }
        `;

      const response = await request(app)
        .post("/graphql")
        .set("Authorization", `Bearer `)
        .send({ query: updateJobPrefsMutation });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe(
        "Update Failed: Invalid Token",
      );
    });
  });

  describe("User Profile Mutations", () => {
    let token: string;

    beforeAll(async () => {
      token = await loginAndGetToken(
        "newuser@example.com",
        "StrongPassword123",
      );
    });

    describe("get authenticate user data", () => {
      let token: string;

      beforeAll(async () => {
        token = await loginAndGetToken(
          "newuser@example.com",
          "StrongPassword123",
        );
      });

      it("Should retrieve the authenticated user data when the user is authenticated", async () => {
        const query = `
          query Query {
            getAuthenticatedUser {
              _id
              email
              username
            }
          }
        `;

        const response = await request(app)
          .post("/graphql")
          .set("Authorization", `Bearer ${token}`)
          .send({ query });

        expect(response.status).toBe(200);
        expect(response.body.data.getAuthenticatedUser).toBeDefined();
      });

      it("Should return an error when no valid token is provided", async () => {
        const query = `
          query Query {
            getAuthenticatedUser {
              _id
              email
              username
            }
          }
        `;

        const response = await request(app).post("/graphql").send({ query });

        expect(response.status).toBe(200);

        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toBe(
          "You have to login first!",
        );
      });

      it("Should retrieve the authenticated user data when the user is authenticated", async () => {
        const query = `
          query GetAuthenticatedUser {
            getAuthenticatedUser {
              _id
              username
              email
            }
          }
        `;

        const response = await request(app)
          .post("/graphql")
          .set("Authorization", `Bearer ${token}`)
          .send({ query });

        expect(response.status).toBe(200);
        expect(response.body.data.getAuthenticatedUser).toBeDefined();
        expect(response.body.data.getAuthenticatedUser._id).toBeDefined();
        expect(response.body.data.getAuthenticatedUser.email).toBeDefined();
        expect(response.body.data.getAuthenticatedUser.username).toBeDefined();
      });
    });

    describe("should update user online presence", () => {
      let token: string;

      beforeAll(async () => {
        token = await loginAndGetToken(
          "newuser@example.com",
          "StrongPassword123",
        );
      });

      it("should successfully update user online presence to 1", async () => {
        const mutation = `
          mutation UpdateUserPresence($isOnline: Boolean!) {
            updateUserPresence(isOnline: $isOnline) {
              _id
              email
              username
              isOnline
            }
          }
          `;

        const response = await performMutation(token, mutation, {
          isOnline: true,
        });
        expect(response.status).toBe(200);
        expect(response.body.data.updateUserPresence).toBeDefined();
        expect(response.body.data.updateUserPresence).toMatchObject({
          isOnline: 1,
        });
      });

      it("should successfully update user online presence to 0 (offline)", async () => {
        const mutation = `
          mutation UpdateUserPresence($isOnline: Boolean!) {
            updateUserPresence(isOnline: $isOnline) {
              _id
              email
              username
              isOnline
            }
          }
          `;

        const response = await performMutation(token, mutation, {
          isOnline: false,
        });
        expect(response.status).toBe(200);
        expect(response.body.data.updateUserPresence).toBeDefined();
        expect(response.body.data.updateUserPresence).toMatchObject({
          isOnline: -1,
        });
      });
    });

    describe("User Profile Add Mutations", () => {
      it("should add an experience to a user’s profile", async () => {
        const addExperienceMutation = `
              mutation AddExperience($input: ExperienceInput) {
                addExperience(input: $input) {
                  _id
                  bio
                  location
                  experiences {
                    _id
                    jobTitle
                    institute
                    startDate
                    endDate
                  }
                  createdAt
                  updatedAt
                }
              }
            `;

        const experienceInput = {
          jobTitle: "Software Engineer",
          institute: "Tech Company",
          startDate: "2022-01-01",
          endDate: "2023-01-01",
        };

        const response = await performMutation(token, addExperienceMutation, {
          input: experienceInput,
        });

        expect(response.status).toBe(200);
        expect(response.body.data.addExperience).toBeDefined();
        expect(response.body.data.addExperience.experiences).toHaveLength(1);
        const addedExperience = response.body.data.addExperience.experiences[0];
        expect(addedExperience.jobTitle).toBe("Software Engineer");
        expect(addedExperience.institute).toBe("Tech Company");
        expect(addedExperience.startDate).toBe("2022-01-01T00:00:00.000Z");
        expect(addedExperience.endDate).toBe("2023-01-01T00:00:00.000Z");
      });

      it("should add a license to a user’s profile", async () => {
        const addLicenseMutation = `
              mutation AddLicense($input: LicenseInput) {
                addLicense(input: $input) {
                  _id
                  bio
                  location
                  licenses {
                    _id
                    number
                    name
                    issuedBy
                    issuedAt
                    expiryDate
                  }
                  createdAt
                  updatedAt
                }
              }
            `;

        const licenseInput = {
          expiryDate: "2025-11-11",
          name: "Hello World",
          number: "1249013579235",
          issuedBy: "Government",
          issuedAt: "2024-11-11",
        };

        const response = await performMutation(token, addLicenseMutation, {
          input: licenseInput,
        });

        expect(response.status).toBe(200);
        expect(response.body.data.addLicense).toBeDefined();
        expect(response.body.data.addLicense.licenses).toHaveLength(1);
        const addedLicense = response.body.data.addLicense.licenses[0];
        expect(addedLicense.number).toBe("1249013579235");
        expect(addedLicense.name).toBe("Hello World");
        expect(addedLicense.issuedBy).toBe("Government");
        expect(addedLicense.issuedAt).toBe("2024-11-11T00:00:00.000Z");
        expect(addedLicense.expiryDate).toBe("2025-11-11T00:00:00.000Z");
      });

      it("should add an education to a user’s profile", async () => {
        const addEducationMutation = `
                mutation AddEducation($input: EducationInput) {
                  addEducation(input: $input) {
                      _id
                      bio
                      location
                      createdAt
                      updatedAt
                      education {
                          _id
                          name
                          institute
                          startDate
                          endDate
                      }
                  }
              }
              `;

        const educationInput = {
          name: "Engineering",
          institute: "University of xyz",
          startDate: "2019-11-11",
          endDate: "2023-11-11",
        };

        const response = await performMutation(token, addEducationMutation, {
          input: educationInput,
        });

        expect(response.status).toBe(200);
        expect(response.body.data.addEducation).toBeDefined();
        expect(response.body.data.addEducation.education).toHaveLength(1);
        const addedEducation = response.body.data.addEducation.education[0];
        expect(addedEducation.name).toBe("Engineering");
        expect(addedEducation.institute).toBe("University of xyz");
        expect(addedEducation.startDate).toBe("2019-11-11T00:00:00.000Z");
        expect(addedEducation.endDate).toBe("2023-11-11T00:00:00.000Z");
      });
    });

    describe("User Profile Add Mutation Fail", () => {
      let token: string;

      beforeAll(async () => {
        token = await loginAndGetToken(
          "newuser@example.com",
          "StrongPassword123",
        );
      });

      it("should fail to add an experience to a user’s profile", async () => {
        const addExperienceMutation = `
              mutation AddExperience($input: ExperienceInput) {
                addExperience(input: $input) {
                  _id
                  bio
                  location
                  experiences {
                    _id
                    jobTitle
                    institute
                    startDate
                    endDate
                  }
                  createdAt
                  updatedAt
                }
              }
            `;

        const experienceInput = {
          jobTitle: "",
          institute: "Tech Company",
          startDate: "2022-01-01",
          endDate: "2023-01-01",
        };

        const response = await performMutation(token, addExperienceMutation, {
          input: experienceInput,
        });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toContain("Adding Failed");
      });

      it("should fail to add an education to a user’s profile", async () => {
        const addEducationMutation = `
                mutation AddEducation($input: EducationInput) {
                  addEducation(input: $input) {
                      _id
                      bio
                      location
                      createdAt
                      updatedAt
                      education {
                          _id
                          name
                          institute
                          startDate
                          endDate
                      }
                  }
              }
              `;

        const educationInput = {
          name: "",
          institute: "University of xyz",
          startDate: "2019-11-11",
          endDate: "2023-11-11",
        };

        const response = await performMutation(token, addEducationMutation, {
          input: educationInput,
        });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toContain("Adding Failed");
      });

      it("should fail to add a license to a user’s profile", async () => {
        const addLicenseMutation = `
              mutation AddLicense($input: LicenseInput) {
                addLicense(input: $input) {
                  _id
                  bio
                  location
                  licenses {
                    _id
                    number
                    name
                    issuedBy
                    issuedAt
                    expiryDate
                  }
                  createdAt
                  updatedAt
                }
              }
            `;

        const licenseInput = {
          expiryDate: "2025-11-11",
          name: "",
          number: "1249013579235",
          issuedBy: "Government",
          issuedAt: "2024-11-11",
        };

        const response = await performMutation(token, addLicenseMutation, {
          input: licenseInput,
        });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toContain("Adding Failed");
      });
    });

    describe("User Profile Update Mutations", () => {
      let token: string;

      beforeAll(async () => {
        token = await loginAndGetToken(
          "newuser@example.com",
          "StrongPassword123",
        );
      });

      it("should update a user's specific experience data", async () => {
        const experienceId = await getIdByType("experiences");

        const updateExperienceMutation = `
              mutation UpdateExperience($experienceId: String!, $input: ExperienceInput) {
                updateExperience(experienceId: $experienceId, input: $input) {
                    _id
                    bio
                    location
                    experiences {
                        _id
                        jobTitle
                        institute
                        startDate
                        endDate
                    }
                    createdAt
                    updatedAt
                }
                }
            `;

        const experienceInput = {
          jobTitle: "Back-end Engineer",
          institute: "Tech Company",
          startDate: "2022-01-01",
          endDate: "2023-01-01",
        };

        const response = await performMutation(
          token,
          updateExperienceMutation,
          {
            experienceId: experienceId,
            input: experienceInput,
          },
        );

        expect(response.status).toBe(200);
        expect(response.body.data.updateExperience).toBeDefined();
        expect(
          response.body.data.updateExperience.experiences[0].jobTitle,
        ).toBe("Back-end Engineer");
        expect(
          response.body.data.updateExperience.experiences[0].institute,
        ).toBe("Tech Company");
        expect(
          response.body.data.updateExperience.experiences[0].startDate,
        ).toBe("2022-01-01T00:00:00.000Z");
        expect(response.body.data.updateExperience.experiences[0].endDate).toBe(
          "2023-01-01T00:00:00.000Z",
        );
      });

      it("should update a user's specific education data", async () => {
        const educationId = await getIdByType("education");

        const updateEducationMutation = `
          mutation UpdateEducation($educationId: String!, $input: EducationInput) {
            updateEducation(educationId: $educationId, input: $input) {
                _id
                bio
                location
                education {
                    _id
                    name
                    institute
                    startDate
                    endDate
                }
                createdAt
                updatedAt
            }
        }
        `;

        const educationInput = {
          name: "Civil Engineering",
          institute: "University of xyz",
          startDate: "2019-11-11",
          endDate: "2023-11-11",
        };

        const response = await performMutation(token, updateEducationMutation, {
          educationId: educationId,
          input: educationInput,
        });

        expect(response.status).toBe(200);
        expect(response.body.data.updateEducation).toBeDefined();
        expect(response.body.data.updateEducation.education[0].institute).toBe(
          "University of xyz",
        );
        expect(response.body.data.updateEducation.education[0].name).toBe(
          "Civil Engineering",
        );
        expect(response.body.data.updateEducation.education[0].startDate).toBe(
          "2019-11-11T00:00:00.000Z",
        );
        expect(response.body.data.updateEducation.education[0].endDate).toBe(
          "2023-11-11T00:00:00.000Z",
        );
      });

      it("should update a user's specific license data", async () => {
        const licenseId = await getIdByType("licenses");
        const updateLicenseMutation = `
          mutation UpdateLicense($licenseId: String!, $input: LicenseInput) {
            updateLicense(licenseId: $licenseId, input: $input) {
              _id
              bio
              location
              licenses {
                _id
                number
                name
                issuedBy
                issuedAt
                expiryDate
              }
              createdAt
              updatedAt
            }
          }
        `;

        const licenseInput = {
          expiryDate: "2026-11-12",
          name: "Updated License Name",
          number: "1249013579235-updated",
          issuedBy: "Updated Government",
          issuedAt: "2024-11-12",
        };

        const response = await performMutation(token, updateLicenseMutation, {
          licenseId: licenseId,
          input: licenseInput,
        });

        expect(response.status).toBe(200);
        expect(response.body.data.updateLicense).toBeDefined();
        expect(response.body.data.updateLicense.licenses).toHaveLength(1);

        const updatedLicense = response.body.data.updateLicense.licenses[0];
        expect(updatedLicense.number).toBe("1249013579235-updated");
        expect(updatedLicense.name).toBe("Updated License Name");
        expect(updatedLicense.issuedBy).toBe("Updated Government");
        expect(updatedLicense.issuedAt).toBe("2024-11-12T00:00:00.000Z");
        expect(updatedLicense.expiryDate).toBe("2026-11-12T00:00:00.000Z");
      });
    });

    describe("User Profile Update Mutations Fail", () => {
      let token: string;

      beforeAll(async () => {
        token = await loginAndGetToken(
          "newuser@example.com",
          "StrongPassword123",
        );
      });

      it("should fail to update a user's specific experience data", async () => {
        const experienceId = await getIdByType("experiences");

        const updateExperienceMutation = `
                  mutation UpdateExperience($experienceId: String!, $input: ExperienceInput) {
                    updateExperience(experienceId: $experienceId, input: $input) {
                        _id
                        bio
                        location
                        experiences {
                            _id
                            jobTitle
                            institute
                            startDate
                            endDate
                        }
                        createdAt
                        updatedAt
                    }
                    }
                `;

        const experienceInput = {
          jobTitle: "",
          institute: "Tech Company",
          startDate: "2022-01-01",
          endDate: "2023-01-01",
        };

        const response = await performMutation(
          token,
          updateExperienceMutation,
          {
            experienceId: experienceId,
            input: experienceInput,
          },
        );

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toContain("Update Failed");
      });

      it("should fail to update a user's specific education data", async () => {
        const educationId = await getIdByType("education");

        const updateEducationMutation = `
          mutation UpdateEducation($educationId: String!, $input: EducationInput) {
            updateEducation(educationId: $educationId, input: $input) {
                _id
                bio
                location
                education {
                    _id
                    name
                    institute
                    startDate
                    endDate
                }
                createdAt
                updatedAt
            }
        }
        `;

        const educationInput = {
          name: "",
          institute: "University of xyz",
          startDate: "2019-11-11",
          endDate: "2023-11-11",
        };

        const response = await performMutation(token, updateEducationMutation, {
          educationId: educationId,
          input: educationInput,
        });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toContain("Update Failed");
      });

      it("should fail to update a user's specific license data", async () => {
        const licenseId = await getIdByType("licenses");
        const updateLicenseMutation = `
          mutation UpdateLicense($licenseId: String!, $input: LicenseInput) {
            updateLicense(licenseId: $licenseId, input: $input) {
              _id
              bio
              location
              licenses {
                _id
                number
                name
                issuedBy
                issuedAt
                expiryDate
              }
              createdAt
              updatedAt
            }
          }
        `;

        const licenseInput = {
          expiryDate: "2026-11-12",
          name: "",
          number: "1249013579235-updated",
          issuedBy: "Updated Government",
          issuedAt: "2024-11-12",
        };

        const response = await performMutation(token, updateLicenseMutation, {
          licenseId: licenseId,
          input: licenseInput,
        });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toContain("Update Failed");
      });
    });

    describe("User Profile Delete Mutations", () => {
      let token: string;

      beforeAll(async () => {
        token = await loginAndGetToken(
          "newuser@example.com",
          "StrongPassword123",
        );
      });

      it("should delete a user's specific experience data", async () => {
        const experienceId = await getIdByType("experiences");

        const deleteExperienceMutation = `
          mutation Mutation($experienceId: String!) {
            deleteExperience(experienceId: $experienceId) {
                _id
                experiences {
                    _id
                    jobTitle
                    institute
                    startDate
                    endDate
                }
            }
            }
        `;

        const response = await performMutation(
          token,
          deleteExperienceMutation,
          {
            experienceId: experienceId,
          },
        );

        expect(response.status).toBe(200);
        expect(response.body.data.deleteExperience).toBeDefined();
        const remainingExperience =
          response.body.data.deleteExperience.experiences;
        const deletedLicense = remainingExperience.find(
          (experience) => experience._id === experienceId,
        );
        expect(deletedLicense).toBeUndefined();
      });

      it("should delete a user's specific license data", async () => {
        const licenseId = await getIdByType("licenses");

        const deleteLicenseMutation = `
          mutation DeleteLicense($licenseId: String!) {
            deleteLicense(licenseId: $licenseId) {
              _id
              bio
              location
              licenses {
                _id
                number
                name
                issuedBy
                issuedAt
                expiryDate
              }
              createdAt
              updatedAt
            }
          }
        `;

        const response = await performMutation(token, deleteLicenseMutation, {
          licenseId: licenseId,
        });

        expect(response.status).toBe(200);
        expect(response.body.data.deleteLicense).toBeDefined();

        const remainingLicenses = response.body.data.deleteLicense.licenses;
        const deletedLicense = remainingLicenses.find(
          (license) => license._id === licenseId,
        );
        expect(deletedLicense).toBeUndefined();
      });

      it("should delete a user's specific education data", async () => {
        const educationId = await getIdByType("education");

        const deleteEducationMutation = `
          mutation DeleteEducation($educationId: String!) {
            deleteEducation(educationId: $educationId) {
                _id
                bio
                location
                education {
                    _id
                    name
                    institute
                    startDate
                    endDate
                }
                createdAt
                updatedAt
            }
        }
        `;

        const response = await performMutation(token, deleteEducationMutation, {
          educationId: educationId,
        });

        expect(response.status).toBe(200);
        expect(response.body.data.deleteEducation).toBeDefined();

        const remainingEducation = response.body.data.deleteEducation.education;
        const deletedLicense = remainingEducation.find(
          (education) => education._id === educationId,
        );
        expect(deletedLicense).toBeUndefined();
      });
    });

    describe("User Profile Delete Mutations Fail", () => {
      let token: string;

      beforeAll(async () => {
        token = await loginAndGetToken(
          "newuser@example.com",
          "StrongPassword123",
        );
      });

      it("should fail to delete a user's specific experience data", async () => {
        const experienceId = "aelkjgliaejg3920jg0";

        const deleteExperienceMutation = `
          mutation Mutation($experienceId: String!) {
            deleteExperience(experienceId: $experienceId) {
                _id
                experiences {
                    _id
                    jobTitle
                    institute
                    startDate
                    endDate
                }
            }
            }
        `;

        const response = await performMutation(
          token,
          deleteExperienceMutation,
          {
            experienceId: experienceId,
          },
        );

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toContain("Delete Failed");
      });

      it("should fail to delete a user's specific license data", async () => {
        const licenseId = "8dkajghaweg08gasfawf";

        const deleteLicenseMutation = `
          mutation DeleteLicense($licenseId: String!) {
            deleteLicense(licenseId: $licenseId) {
              _id
              bio
              location
              licenses {
                _id
                number
                name
                issuedBy
                issuedAt
                expiryDate
              }
              createdAt
              updatedAt
            }
          }
        `;

        const response = await performMutation(token, deleteLicenseMutation, {
          licenseId: licenseId,
        });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toContain("Delete Failed");
      });

      it("should fail to delete a user's specific education data", async () => {
        const educationId = "awflawifjawlifj10983";

        const deleteEducationMutation = `
          mutation DeleteEducation($educationId: String!) {
            deleteEducation(educationId: $educationId) {
                _id
                bio
                location
                education {
                    _id
                    name
                    institute
                    startDate
                    endDate
                }
                createdAt
                updatedAt
            }
        }
        `;

        const response = await performMutation(token, deleteEducationMutation, {
          educationId: educationId,
        });

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toContain("Delete Failed");
      });
    });
  });
});
