import { Express } from "express";
import request from "supertest";
import { setupTestEnvironment, teardownTestEnvironment } from "./setup";
import { signToken } from "../helpers/jwt";
import { register } from "../models/user.model";
import Application from "../models/application.model";
import Collection from "../models/collection.model";

describe("Application", () => {
  let app: Express;
  let user;
  let accessToken;
  let application;
  let task;

  beforeAll(async () => {
    jest.setTimeout(20000);
    app = await setupTestEnvironment();
    user = await register(
      "testuser",
      "testavatar",
      "testfullname",
      "test@mail.com",
      "Password123@",
    );

    accessToken = signToken({
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
    });

    application = new Application({
      ownerId: user._id,
      collectionId: null,
      jobTitle: "Software Engineer",
      description: "Software Engineer at Google",
      organizationName: "Google",
      organizationAddress: "Mountain View, CA",
      organizationLogo: "https://google.com/logo.png",
      location: "Mountain View, CA",
      salary: 150000,
      type: "Full-time",
      startDate: "2022-01-01",
      endDate: "2022-12-31",
      tasks: [
        {
          title: "Task 1",
          description: "Task 1 description",
          completed: false,
          dueDate: "2022-01-01",
        },
        {
          title: "Task 2",
          description: "Task 2 description",
          completed: false,
          dueDate: "2022-01-02",
        },
      ],
    });

    task = application.tasks[0];

    await application.save();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  it("Should return the nearest due date task that is not completed for authenticated user", async () => {
    const query = `
      query GetSortedByPriorityApplication {
        getSortedByPriorityApplication {
          _id
          tasks {
            _id
            title
            description
            completed
            dueDate
            createdAt
            updatedAt
          }
        }
      }
    `;

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ query });

    expect(response.status).toBe(200);
    expect(response.body.data.getSortedByPriorityApplication).toBeDefined();
  });

  it("should fail to return the nearest due date task that is not completed if the user is not authenticated", async () => {
    const query = `
      query GetSortedByPriorityApplication {
        getSortedByPriorityApplication {
          _id
          tasks {
            _id
            title
            description
            completed
            dueDate
            createdAt
            updatedAt
          }
        }
      }
    `;

    const response = await request(app).post("/graphql").send({ query });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
  });

  it("Should not return any application when user is not authenticated", async () => {
    const query = `
      query GetAllApplication {
          getAllApplication {
              _id
              ownerId
              collectionId
              jobTitle
              description
              organizationName
              organizationAddress
              organizationLogo
              location
              salary
              type
              startDate
              endDate
              createdAt
              updatedAt
          }
      }
    `;

    const response = await request(app).post("/graphql").send({ query });

    expect(response.status).toBe(200);
    expect(response.body.data.getAllApplication).toBeNull();
    expect(response.body.errors).toBeDefined();
  });

  it("Should not create a new application when user is not authenticated", async () => {
    const query = `
      mutation CreateApplication {
          createApplication(input: {
              collectionId: null,
              jobTitle: "Software Engineer",
              description: "Software Engineer at Google",
              organizationName: "Google",
              organizationAddress: "Mountain View, CA",
              organizationLogo: "https://google.com/logo.png",
              location: "Mountain View, CA",
              salary: 150000,
              type: "Full-time",
              startDate: "2022-01-01",
              endDate: "2022-12-31"
          }
          ) {
              _id
              ownerId
              collectionId
              jobTitle
              description
              organizationName
              organizationAddress
              organizationLogo
              location
              salary
              type
              startDate
              endDate
              createdAt
              updatedAt
          }
      }
    `;
    const response = await request(app).post("/graphql").send({ query });

    expect(response.status).toBe(200);
    expect(response.body.data.createApplication).toBeNull();
    expect(response.body.errors).toBeDefined();
  });

  it("Should create a new application for authenticated user", async () => {
    const query = `
      mutation CreateApplication {
          createApplication(input: {
              collectionId: null,
              jobTitle: "Software Engineer",
              description: "Software Engineer at Google",
              organizationName: "Google",
              organizationAddress: "Mountain View, CA",
              organizationLogo: "https://google.com/logo.png",
              location: "Mountain View, CA",
              salary: 150000,
              type: "Full-time",
              startDate: "2022-01-01",
              endDate: "2022-12-31"
          }
          ) {
              _id
              ownerId
              collectionId
              jobTitle
              description
              organizationName
              organizationAddress
              organizationLogo
              location
              salary
              type
              startDate
              endDate
              createdAt
              updatedAt
          }
      }
    `;

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ query });

    expect(response.status).toBe(200);
    expect(response.body.data.createApplication).toBeDefined();
    expect(response.body.data.createApplication.ownerId).toBe(
      user._id.toString(),
    );
    expect(response.body.data.createApplication.collectionId).toBeNull();
  });

  it("should throw an error if collectionId is invalid or not found", async () => {
    const invalidCollectionId = "605c72ef153207001f6438a";

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        query: `
          mutation CreateApplication($input: ApplicationInput!) {
            createApplication(input: $input) {
              jobTitle
            }
          }
        `,
        variables: {
          input: {
            ownerId: user._id,
            collectionId: invalidCollectionId,
            jobTitle: "Software Engineer",
            description: "Software Engineer at Google",
            organizationName: "Google",
            organizationAddress: "Mountain View, CA",
            organizationLogo: "https://google.com/logo.png",
            location: "Mountain View, CA",
            salary: 150000,
            type: "Full-time",
            startDate: "2022-01-01",
            endDate: "2022-12-31",
            tasks: [
              {
                title: "Task 1",
                description: "Task 1 description",
                completed: false,
                dueDate: "2022-01-01",
              },
            ],
          },
        },
      });

    console.log(response.body, "<<< pertama");
    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toBe("Collection not found");
  });

  it("should successfully create an application and add it to the collection", async () => {
    const collection = new Collection({
      name: "Engineering Jobs",
      description: "A collection for engineering job applications",
    });
    await collection.save();

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        query: `
          mutation CreateApplication($input: ApplicationInput!) {
            createApplication(input: $input) {
              jobTitle
              collectionId
            }
          }
        `,
        variables: {
          input: {
            ownerId: user._id,
            collectionId: collection._id,
            jobTitle: "Software Engineer",
            description: "Software Engineer at Google",
            organizationName: "Google",
            organizationAddress: "Mountain View, CA",
            organizationLogo: "https://google.com/logo.png",
            location: "Mountain View, CA",
            salary: 150000,
            type: "Full-time",
            startDate: "2022-01-01",
            endDate: "2022-12-31",
            tasks: [
              {
                title: "Task 1",
                description: "Task 1 description",
                completed: false,
                dueDate: "2022-01-01",
              },
            ],
          },
        },
      });

    console.log(response.body, "<<< kedua");
    expect(response.status).toBe(200);
    expect(response.body.data.createApplication).toBeDefined();
    expect(response.body.data.createApplication.collectionId.toString()).toBe(
      collection._id.toString(),
    );
    expect(response.body.data.createApplication.jobTitle).toBe(
      "Software Engineer",
    );

    // const createdApplication = response.body.data.createApplication;
    // expect(createdApplication.jobTitle).toBe("Software Engineer");
    // expect(createdApplication.collectionId).toBe(collection._id.toString());

    // Cek apakah aplikasi sudah ditambahkan ke dalam collection
    // const updatedCollection = await Collection.findById(collection._id);
    // expect(updatedCollection.applications).toContainEqual(
    //   createdApplication._id,
    // );
  });

  it("Should return all applications for authenticated user", async () => {
    const query = `
      query GetAllApplication {
          getAllApplication {
              _id
              ownerId
              collectionId
              jobTitle
              description
              organizationName
              organizationAddress
              organizationLogo
              location
              salary
              type
              startDate
              endDate
              createdAt
              updatedAt
          }
      }
    `;

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ query });

    expect(response.status).toBe(200);
    expect(response.body.data.getAllApplication).toBeDefined();
  });

  it("Should return an application by id for authenticated user", async () => {
    const query = `
    query GetApplicationById($id: ID!) {
      getApplicationById(_id: $id) {
          _id
          ownerId
          collectionId
          jobTitle
          description
          organizationName
          organizationAddress
          organizationLogo
          location
          salary
          type
          startDate
          endDate
          createdAt
          updatedAt
          tasks {
              _id
              title
              description
              completed
              dueDate
              createdAt
              updatedAt
          }
      }
    }`;

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        query,
        variables: {
          id: application.id,
        },
      });
    expect(response.status).toBe(200);
    expect(response.body.data.getApplicationById).toBeDefined();
  });

  it("Should not return an application by id if the application is not exist", async () => {
    const query = `
    query GetApplicationById($id: ID!) {
      getApplicationById(_id: $id) {
          _id
          ownerId
          collectionId
          jobTitle
          description
          organizationName
          organizationAddress
          organizationLogo
          location
          salary
          type
          startDate
          endDate
          createdAt
          updatedAt
          tasks {
              _id
              title
              description
              completed
              dueDate
              createdAt
              updatedAt
          }
      }
    }`;

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        query,
        variables: {
          id: "60c3c1b4b5f1f7b0d4c1e8a3",
        },
      });
    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
  });

  it("Should return tasks generated by AI for authenticated user", async () => {
    jest.setTimeout(20000);
    const query = `
      mutation GetTasksGeneratedByAi($id: ID!) {
        getTasksGeneratedByAi(_id: $id) {
            _id
            title
            description
            completed
            dueDate
            createdAt
            updatedAt
        }
      }
    `;

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        query,
        variables: {
          id: application.id,
        },
      })
      .timeout(20000);

    expect(response.status).toBe(200);
    expect(response.body.data.getTasksGeneratedByAi).toBeDefined();
  });

  it("Should not return tasks generated by AI  if the application is not exist", async () => {
    const query = `
    mutation GetTasksGeneratedByAi($id: ID!) {
      getTasksGeneratedByAi(_id: $id) {
          _id
          title
          description
          completed
          dueDate
          createdAt
          updatedAt
      }
    }`;

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        query,
        variables: {
          id: "60c3c1b4b5f1f7b0d4c1e8a3",
        },
      });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
  });

  it("Should generate tasks by AI and save them to application", async () => {
    jest.setTimeout(20000);
    const query = `
      mutation GetTasksGeneratedByAi($id: ID!) {
        getTasksGeneratedByAi(_id: $id) {
          _id
          title
          description
          dueDate
          createdAt
          updatedAt
          completed
        }
      }
    `;

    try {
      const response = await request(app)
        .post("/graphql")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          query,
          variables: {
            id: application.id,
          },
        })
        .timeout(20000);

      expect(response.status).toBe(200);

      const tasks = response.body.data.getTasksGeneratedByAi;
      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBeGreaterThan(0);

      const updatedApplication = await Application.findById(application.id);
      expect(updatedApplication).toBeDefined();
      expect(updatedApplication!.tasks.length).toBeGreaterThan(
        application.tasks.length,
      );

      const newTask =
        updatedApplication.tasks[updatedApplication.tasks.length - 1];
      expect(newTask.title).toBeDefined();
      expect(newTask.description).toBeDefined();
      expect(newTask.dueDate).toBeDefined();
      expect(newTask.createdAt).toBeDefined();
      expect(newTask.updatedAt).toBeDefined();
      expect(newTask.completed).toBe(false);
    } catch (error) {
      console.error("Error during GraphQL request:", error);
    }
  });

  it("Should generate advice for a job application by ai", async () => {
    jest.setTimeout(20000);
    const query = `

    mutation GetAdviceForApplicationByAi {
        getAdviceForApplicationByAi(_id: "${application.id}")
    }

    `;

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        query,
        variables: {
          id: application.id,
        },
      })
      .timeout(20000);

    expect(response.status).toBe(200);
    expect(response.body.data.getAdviceForApplicationByAi).toBeDefined();
  });

  it("Should not generate advice for a job application by ai if the application is not exist", async () => {
    const query = `

    mutation GetAdviceForApplicationByAi {
        getAdviceForApplicationByAi(_id: "60c3c1b4b5f1f7b0d4c1e8a3")
    }

    `;

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        query,
        variables: {
          id: "60c3c1b4b5f1f7b0d4c1e8a3",
        },
      });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
  });

  it("Should update a job application", async () => {
    const query = `
    mutation UpdateApplication {
      updateApplication(_id: "${application.id}", input: {
        jobTitle: "Software Engineer",
        description: "Software Engineer at Google",
        organizationName: "Google",
        organizationAddress: "Mountain View, CA",
        organizationLogo: "https://google.com/logo.png",
        location: "Mountain View, CA",
        salary: 150000,
        type: "Full-time",
        startDate: "2022-01-01",
        endDate: "2022-12-31"
      }) {
        _id
        ownerId
        collectionId
        jobTitle
        description
        organizationName
        organizationAddress
        organizationLogo
        location
        salary
        type
        startDate
        endDate
        createdAt
        updatedAt
      }
    }
    `;

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ query });

    expect(response.status).toBe(200);
    expect(response.body.data.updateApplication).toBeDefined();
  });

  it("Should fail to update a job application if the application is not exist", async () => {
    const query = `
    mutation UpdateApplication {
      updateApplication(_id: "60c3c1b4b5f1f7b0d4c1e8a3", input: {
        jobTitle: "Software Engineer",
        description: "Software Engineer at Google",
        organizationName: "Google",
        organizationAddress: "Mountain View, CA",
        organizationLogo: "https://google.com/logo.png",
        location: "Mountain View, CA",
        salary: 150000,
        type: "Full-time",
        startDate: "2022-01-01",
        endDate: "2022-12-31"
      }) {
        _id
        ownerId
        collectionId
        jobTitle
        description
        organizationName
        organizationAddress
        organizationLogo
        location
        salary
        type
        startDate
        endDate
        createdAt
        updatedAt
      }
    }
    `;

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ query });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
  });

  it("Should add a task to a job application", async () => {
    const query = `
    mutation AddTaskToApplication {
      addTaskToApplication(applicationId: "${application.id}", task: {
        title: "Task 1",
        description: "Task 1 description",
        completed: false,
        dueDate: "2022-01-01"
      }) {
        _id
        ownerId
        collectionId
        jobTitle
        description
        organizationName
        organizationAddress
        organizationLogo
        location
        salary
        type
        startDate
        endDate
        createdAt
        updatedAt
        tasks {
          _id
          title
          description
          completed
          dueDate
          createdAt
          updatedAt
        }
      }
    }
    `;
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ query });

    expect(response.status).toBe(200);
    expect(response.body.data.addTaskToApplication).toBeDefined();
  });

  it("Should fail to add a task to a job application if the application is not exist", async () => {
    const query = `
    mutation AddTaskToApplication {
      addTaskToApplication(applicationId: "60c3c1b4b5f1f7b0d4c1e8a3", task: {
        title: "Task 1",
        description: "Task 1 description",
        completed: false,
        dueDate: "2022-01-01"
      }) {
        _id
        ownerId
        collectionId
        jobTitle
        description
        organizationName
        organizationAddress
        organizationLogo
        location
        salary
        type
        startDate
        endDate
        createdAt
        updatedAt
        tasks {
          _id
          title
          description
          completed
          dueDate
          createdAt
          updatedAt
        }
      }
    }
    `;
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ query });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
  });

  it("should add a task to a job application", async () => {
    const query = `
    mutation AddTaskToApplication {
      addTaskToApplication(applicationId: "${application.id}", task: {
        title: "Task 1",
        description: "Task 1 description",
        completed: false,
        dueDate: "2022-01-01"
      }) {
        _id
        ownerId
        collectionId
        jobTitle
        description
        organizationName
        organizationAddress
        organizationLogo
        location
        salary
        type
        startDate
        endDate
        createdAt
        updatedAt
        tasks {
          _id
          title
          description
          completed
          dueDate
          createdAt
          updatedAt
        }
      }
    }
    `;
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ query });

    expect(response.status).toBe(200);
    expect(response.body.data.addTaskToApplication).toBeDefined();
  });

  it("should update a task in a job application", async () => {
    const query = `
    mutation UpdateTaskInApplication {
        updateTaskInApplication(
          applicationId: "${application.id}",
          taskId: "${task._id}",
          task: {
            title: "Task 1 updated",
            description: "Task 1 description updated",
            completed: true,
            dueDate: "2022-01-01"
          }
        ) {
            _id
            tasks {
                _id
                title
                description
                completed
                dueDate
                createdAt
                updatedAt
            }
        }
    }
    `;
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ query });

    expect(response.status).toBe(200);
    expect(response.body.data.updateTaskInApplication).toBeDefined();
  });

  it("Should fail to update a task in a job application if the application is not exist", async () => {
    const query = `
    mutation UpdateTaskInApplication {
        updateTaskInApplication(
          applicationId: "60c3c1b4b5f1f7b0d4c1e8a3",
          taskId: "${task._id}",
          task: {
            title: "Task 1 updated",
            description: "Task 1 description updated",
            completed: true,
            dueDate: "2022-01-01"
          }
        ) {
            _id
            tasks {
                _id
                title
                description
                completed
                dueDate
                createdAt
                updatedAt
            }
        }
    }
    `;
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ query });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
  });

  it("Should remove a task from a job application", async () => {
    const query = `
    mutation RemoveTaskFromApplication {
      removeTaskFromApplication(applicationId: "${application.id}", taskId: "${task._id}") {
        _id
        tasks {
          _id
          title
          description
          completed
          dueDate
          createdAt
          updatedAt
        }
      }
    }
    `;

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ query });

    expect(response.status).toBe(200);
    expect(response.body.data.removeTaskFromApplication).toBeDefined();
  });

  it("Should fail to remove a task from a job application if the application is not exist", async () => {
    const query = `
    mutation RemoveTaskFromApplication {
      removeTaskFromApplication(applicationId: "60c3c1b4b5f1f7b0d4c1e8a3", taskId: "${task._id}") {
        _id
        tasks {
          _id
          title
          description
          completed
          dueDate
          createdAt
          updatedAt
        }
      }
    }
    `;
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ query });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
  });

  it("Should fail to remove a task from a job application", async () => {
    const query = `
    mutation RemoveTaskFromApplication {
      removeTaskFromApplication(applicationId: "${application.id}", taskId: "60c3c1b4b5f1f7b0d4c1e8a3") {
        _id
        tasks {
          _id
          title
          description
          completed
          dueDate
          createdAt
          updatedAt
        }
      }
    }
    `;
    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ query });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
  });

  it("Should  delete a job application", async () => {
    const query = `
    mutation DeleteApplication {
      deleteApplication(_id: "${application.id}"){
        _id
      }
    }
    `;

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ query });

    expect(response.status).toBe(200);
    expect(response.body.data.deleteApplication).toMatchObject({
      _id: application.id,
    });
  });

  it("Should fail to delete a job application if application is not exist", async () => {
    const query = `
    mutation DeleteApplication {
      deleteApplication(_id: "60c3c1b4b5f1f7b0d4c1e8a3"){
        _id
      }
    }
    `;

    const response = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ query });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
  });
});
