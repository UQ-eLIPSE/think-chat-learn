# Purpose of util scripts
This is a way to extract information from the DEEP-Concepts DB. The intention is given a `quizId`, an array of `questionIds`, and `courseId`, get retrieve the question and response.

## Example Query
```
export const Query: IQuery = {
    quizId: "some Id that complies with RD",
    questionIds: ["id1", "id2"],
    course: "the courseId"
}
```
## Usage
1. Modify the example to create a query.ts file in /server/utils/
2. Go to root directory 
3. Run build
4. node ./build/server/utils/extractQuestionRespones.js
5. Check out the output.tsv file
