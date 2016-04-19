/**
 * Tests the database wrapper and makes sure the database
 *  can create, read, update and delete
 */
var assert = require('chai').assert;
var db = require('../controllers/database');

describe('Database', function() {

  /**
   * Tests the user database
   */
  describe('user', function() {
    describe('create', function() {
      it("Database should be able to create", function(done) {
        db.user.create({username: "Test"}, function(err, res) {
          assert.equal(err, null);
          assert.equal(res.username, 'Test');
          done();
        });
      });
    });

    describe('read', function() {
      it("Database should be able to read", function(done) {
        db.user.read({username: "Test"}, function(err, res) {
          assert.equal(err, null);
          assert.equal(res[0].username, 'Test');
          done();
        });
      });
    });

    describe('update', function() {
      it("Database should be able to update", function(done) {
        db.user.update({username: "Test"}, {username: "Test1"}, function(err, res) {
          assert.equal(err, null);
          assert.equal(res.n, 1);
          done();
        });
      });
    });

    describe('delete', function() {
      it("Database should be able to delete", function(done) {
        db.user.delete({username: "Test1"}, function(err, res) {
          assert.equal(err, null);
          assert.equal(res.n, 1);
          done();
        });
      });
    });

  });

  /**
   * Tests the question database
   */
  describe('question', function() {

    // A sample question for testing
    var data = {
      "questionGroup" : "test",
      "questionNumber" : 1,
      "probingQuestionOldNumber" : 1,
      "reading" : "This is a real life question from a job interview.<p/>At present a company is experiencing an issue with ants exposing copper telecommunications lines. This results in failure of the lines connection. The cable used has a mass of 0.7kg/m and the line is planned to stretch to 100km between remote townships. The current price of copper is $7000/tonne and the value of plant equipment for this project is $2,000,000.",
      "probingQuestion" : "Using you knowledge of design and materials, what solution from those below would you think was applied to prevent this ant damage from occurring?",
      "probingQuestionChoices" : [
          "The application of a very thin steel foil layer to the cable to prevent the ants from eating into it. This would be done by Electrophoretic deposition",
          "The application of a thin, flexible ceramic layer to the cable to prevent the ants from eating into it. This would be done by Electrophoretic deposition",
          "The application of a thicker polymer sheath to the cable to prevent the ants from eating into it. This would be done via fibre extrusion",
          "No change to the material, it was decided that the best solution was to simply increase the frequency with which the cables were replaced."
      ],
      "probingQuestionAnswer" : 1,
      "explanation" : "<p>The correct answer is <span id=\"moocchat-choice-1-box\" class=\"moocchat-choice-box-inline moocchat-choice-box-1\">B</span>. A thin layer of ceramic material was applied to the cable. This resulted in a strong layer that could not be cut into by the ants, while requiring little change to the operation of the wire production.</p><p>Option <span id=\"moocchat-choice-0-box\" class=\"moocchat-choice-box-inline moocchat-choice-box-0\">A</span> leaves open the problem with corrosion and also possible shorting, as well such a thin foil can actually be cur through by ants. A similar problem is posed by <span id=\"moocchat-choice-2-box\" class=\"moocchat-choice-box-inline moocchat-choice-box-2\">C</span>, while a thick polymer layer would slow down the process it would still eventually happen.</p><p>Option <span id=\"moocchat-choice-3-box\" class=\"moocchat-choice-box-inline moocchat-choice-box-3\">D</span> is just too costly, as localised faults like this are very hard to pinpoint. This would require digging up a large portion of the line and replacing it. Making this option very costly and not desirable.</p>",
      "evaluationOldNumber" : 100,
      "evaluationReading" : "",
      "evaluationQuestion" : "",
      "evaluationChoices" : [
          ""
      ],
      "evaluationAnswer" : 0,
      "evalExplanation" : "<p></p>",
      "stageDurations" : [
          -1,
          300,
          240,
          90,
          240,
          90,
          300,
          90
      ],
      "maxChoiceForStudentGenerateQuestion" : 1,
      "crCategory" : "weakenArgument"
    };

    describe('create', function() {
      it("Database should be able to create", function(done) {
        db.user.create(data, function(err, res) {
          assert.equal(err, null);
          assert.equal(res.questionGroup, "test");
          done();
        });
      });
    });

    describe('read', function() {
      it("Database should be able to read", function(done) {
        db.user.read({questionGroup: "test"}, function(err, res) {
          assert.equal(err, null);
          assert.equal(res[0].questionGroup, "test");
          done();
        });
      });
    });

    describe('update', function() {
      it("Database should be able to update", function(done) {
        db.user.update({questionGroup: "test"}, {questionGroup: "test1"}, function(err, res) {
          assert.equal(err, null);
          assert.equal(res.n, 1);
          done();
        });
      });
    });

    describe('delete', function() {
      it("Database should be able to delete", function(done) {
        db.user.delete({questionGroup: "test1"}, function(err, res) {
          assert.equal(err, null);
          assert.equal(res.n, 1);
          done();
        });
      });
    });

  });

  /**
   * Tests the quizroom database
   */
  describe('quizroom', function() {
    describe('create', function() {
      it("Database should be able to create", function(done) {
        db.quizroom.create({quizRoomID: "Test"}, function(err, res) {
          assert.equal(err, null);
          assert.equal(res.quizRoomID, 'Test');
          done();
        });
      });
    });

    describe('read', function() {
      it("Database should be able to read", function(done) {
        db.quizroom.read({quizRoomID: "Test"}, function(err, res) {
          assert.equal(err, null);
          assert.equal(res[0].quizRoomID, 'Test');
          done();
        });
      });
    });

    describe('update', function() {
      it("Database should be able to update", function(done) {
        db.quizroom.update({quizRoomID: "Test"}, {quizRoomID: "Test1"}, function(err, res) {
          assert.equal(err, null);
          assert.equal(res.n, 1);
          done();
        });
      });
    });

    describe('delete', function() {
      it("Database should be able to delete", function(done) {
        db.quizroom.delete({quizRoomID: "Test1"}, function(err, res) {
          assert.equal(err, null);
          assert.equal(res.n, 1);
          done();
        });
      });
    });

  });

  /**
   * Tests the userflow database
   */
  describe('userflow', function() {
    describe('create', function() {
      it("Database should be able to create", function(done) {
        db.userflow.create({username: "Test"}, function(err, res) {
          assert.equal(err, null);
          assert.equal(res.username, 'Test');
          done();
        });
      });
    });

    describe('read', function() {
      it("Database should be able to read", function(done) {
        db.userflow.read({username: "Test"}, function(err, res) {
          assert.equal(err, null);
          assert.equal(res[0].username, 'Test');
          done();
        });
      });
    });

    describe('update', function() {
      it("Database should be able to update", function(done) {
        db.userflow.update({username: "Test"}, {username: "Test1"}, function(err, res) {
          assert.equal(err, null);
          assert.equal(res.n, 1);
          done();
        });
      });
    });

    describe('delete', function() {
      it("Database should be able to delete", function(done) {
        db.userflow.delete({username: "Test1"}, function(err, res) {
          assert.equal(err, null);
          assert.equal(res.n, 1);
          done();
        });
      });
    });

  });

  /**
   * Tests the userlogin database
   */
  describe('userlogin', function() {
    describe('create', function() {
      it("Database should be able to create", function(done) {
        db.userlogin.create({username: "Test"}, function(err, res) {
          assert.equal(err, null);
          assert.equal(res.username, 'Test');
          done();
        });
      });
    });

    describe('read', function() {
      it("Database should be able to read", function(done) {
        db.userlogin.read({username: "Test"}, function(err, res) {
          assert.equal(err, null);
          assert.equal(res[0].username, 'Test');
          done();
        });
      });
    });

    describe('update', function() {
      it("Database should be able to update", function(done) {
        db.userlogin.update({username: "Test"}, {username: "Test1"}, function(err, res) {
          assert.equal(err, null);
          assert.equal(res.n, 1);
          done();
        });
      });
    });

    describe('delete', function() {
      it("Database should be able to delete", function(done) {
        db.userlogin.delete({username: "Test1"}, function(err, res) {
          assert.equal(err, null);
          assert.equal(res.n, 1);
          done();
        });
      });
    });

  });

  /**
   * Tests the userquiz database
   */
  describe('userquiz', function() {
    describe('create', function() {
      it("Database should be able to create", function(done) {
        db.userquiz.create({username: "Test"}, function(err, res) {
          assert.equal(err, null);
          assert.equal(res.username, 'Test');
          done();
        });
      });
    });

    describe('read', function() {
      it("Database should be able to read", function(done) {
        db.userquiz.read({username: "Test"}, function(err, res) {
          assert.equal(err, null);
          assert.equal(res[0].username, 'Test');
          done();
        });
      });
    });

    describe('update', function() {
      it("Database should be able to update", function(done) {
        db.userquiz.update({username: "Test"}, {username: "Test1"}, function(err, res) {
          assert.equal(err, null);
          assert.equal(res.n, 1);
          done();
        });
      });
    });

    describe('delete', function() {
      it("Database should be able to delete", function(done) {
        db.userquiz.delete({username: "Test1"}, function(err, res) {
          assert.equal(err, null);
          assert.equal(res.n, 1);
          done();
        });
      });
    });

  });

});
