import assert from "assert";
import server from "../server";
it("Should be true", async () => {
  const response = await server.executeOperation({
    query: `
    query Books {
      books {
        title
        author
      }
    }
    `,
  });

  assert(response.body.kind === "single");
  expect(response.body.singleResult.errors).toBeUndefined();
  expect(response.body.singleResult.data?.books).toMatchObject([
    {
      title: "test",
      author: "test",
    },
  ]);
});
