# Entities

This documentation provides details on each field and its purpose, helping developers understand the structure and relationships between the entities.

## User Service

### User

Represents a user in the system.

- **\_id**: `ObjectId`  
  Unique identifier for the user.
- **username**: `string`  
  The user's unique username.
- **avatar**: `string`  
  URL or path to the user's avatar image.
- **fullName**: `string`  
  The user's full name.
- **email**: `string`  
  The user's email address.
- **password**: `string`  
  The user's hashed password.
- **profile**: `Profile`  
  The user's profile information, including bio, location, experiences, education, and licenses.
- **createdAt**: `Date`  
  Timestamp when the user account was created.
- **updatedAt**: `Date`  
  Timestamp when the user account was last updated.

---

### Profile

Represents a user's profile.

- **bio**: `string`  
  A short biography or description of the user.
- **location**: `string`  
  The user's location.
- **experiences**: `Experience[]`  
  A list of professional experiences the user has.
- **educations**: `Education[]`  
  A list of educational qualifications the user has.
- **licenses**: `License[]`  
  A list of licenses or certifications the user holds.

---

### Experience

Represents a professional experience or job.

- **\_id**: `ObjectId`  
  Unique identifier for the experience record.
- **jobTitle**: `string`  
  Job title held during the experience.
- **organization**: `string`  
  Name of the organization where the experience took place.
- **startDate**: `Date`  
  Date the job started.
- **endDate**: `Date`  
  Date the job ended (or expected end date).
- **createdAt**: `Date`  
  Timestamp when the experience record was created.
- **updatedAt**: `Date`  
  Timestamp when the experience record was last updated.

---

### Education

Represents a formal education record.

- **\_id**: `ObjectId`  
  Unique identifier for the education record.
- **degree**: `string`  
  The degree obtained (e.g., Bachelor's, Master's).
- **fieldOfStudy**: `string`  
  Field of study (e.g., Computer Science, Engineering).
- **institute**: `string`  
  Name of the educational institution.
- **startDate**: `Date`  
  Date the education started.
- **endDate**: `Date`  
  Date the education ended (or expected end date).
- **createdAt**: `Date`  
  Timestamp when the education record was created.
- **updatedAt**: `Date`  
  Timestamp when the education record was last updated.

---

### License

Represents a professional license or certification.

- **\_id**: `ObjectId`  
  Unique identifier for the license.
- **name**: `string`  
  Name of the license or certification.
- **institute**: `string`  
  Issuing organization or institute.
- **issuedAt**: `Date`  
  Date the license was issued.
- **expiryDate**: `Date`  
  Date the license expires (if applicable).
- **createdAt**: `Date`  
  Timestamp when the license was created.
- **updatedAt**: `Date`  
  Timestamp when the license was last updated.

---

## Collection Service

### Collection

Represents a collection of related resources (threads, chats, etc.).

- **\_id**: `ObjectId`  
  Unique identifier for the collection.
- **name**: `string`  
  Name of the collection.
- **description**: `string`  
  A description of the collection.
- **public**: `boolean`  
  Indicates if the collection is publicly accessible.
- **ownerId**: `ObjectId`  
  Reference to the user who owns the collection.
- **sharedWith**: `ObjectId[]`  
  A list of user IDs with whom the collection is shared.
- **applications**: `ObjectId[]`  
  A list of application IDs associated with the collection.
- **threads**: `Thread[]`  
  A list of threads associated with the collection.
- **chat**: `Message[]`  
  A list of messages associated with the collection.
- **createdAt**: `Date`  
  Timestamp when the collection was created.
- **updatedAt**: `Date`  
  Timestamp when the collection was last updated.

---

### Thread

Represents a discussion thread.

- **\_id**: `ObjectId`  
  Unique identifier for the thread.
- **title**: `string`  
  Title of the thread.
- **content**: `string`  
  Initial content or description of the thread.
- **authorId**: `ObjectId`  
  Reference to the user who authored the thread.
- **replies**: `Reply[]`  
  A list of replies associated with the thread.
- **createdAt**: `Date`  
  Timestamp when the thread was created.
- **updatedAt**: `Date`  
  Timestamp when the thread was last updated.

---

### Reply

Represents a reply to a thread.

- **\_id**: `ObjectId`  
  Unique identifier for the reply.
- **authorId**: `ObjectId`  
  Reference to the user who authored the reply.
- **content**: `string`  
  The content of the reply.
- **createdAt**: `Date`  
  Timestamp when the reply was created.
- **updatedAt**: `Date`  
  Timestamp when the reply was last updated.

---

### Message

Represents a message in a chat.

- **\_id**: `ObjectId`  
  Unique identifier for the message.
- **senderId**: `ObjectId`  
  Reference to the user who sent the message.
- **content**: `string`  
  Content of the message.
- **createdAt**: `Date`  
  Timestamp when the message was created.
- **updatedAt**: `Date`  
  Timestamp when the message was last updated.

---

## Application Service

### Application

Represents a job application.

- **\_id**: `ObjectId`  
  Unique identifier for the application.
- **jobTitle**: `string`  
  Title of the job for which the application is made.
- **organization**: `string`  
  The organization offering the job.
- **location**: `string`  
  The location of the job.
- **salary**: `number`  
  The salary offered for the job.
- **type**: `string`  
  Job type (e.g., remote, onsite).
- **tasks**: `Task[]`  
  A list of tasks associated with the job application.
- **startDate**: `Date`  
  Start date of the job.
- **endDate**: `Date`  
  End date of the job.
- **createdAt**: `Date`  
  Timestamp when the application was created.
- **updatedAt**: `Date`  
  Timestamp when the application was last updated.

---

### Task

Represents a task associated with an application or job.

- **\_id**: `ObjectId`  
  Unique identifier for the task.
- **title**: `string`  
  Title of the task.
- **description**: `string`  
  A brief description of the task.
- **completed**: `boolean`  
  Indicates if the task has been completed.
- **dueDate**: `Date`  
  The due date for the task.
- **createdAt**: `Date`  
  Timestamp when the task was created.
- **updatedAt**: `Date`  
  Timestamp when the task was last updated.

---
