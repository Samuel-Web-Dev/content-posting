const { expect } = require("chai");
const sinon = require("sinon");
const User = require("../models/user");
const AuthController = require("../controller/auth");
const { default: mongoose } = require("mongoose");

describe("Auth Controller", function() {
  before(function(done) {
    mongoose.connect('mongodb+srv://samlekchris:Xj7j8PGOj9YdG3Id@first-project.y8uqnxq.mongodb.net/blog-test?retryWrites=true&w=majority&appName=first-project').then(() => {
      const user = new User({
        email: 'test@test.com',
        password: 'tester',
        name: 'Test',
        post: [],
        _id: '5c0f66b979af55031b34728a'
      })

      return user.save()
  }).then(() => {
    done()
  })


  })
  it("should throw an error if the database failed with 500 status code", function(done) {
    sinon.stub(User, "findOne")
    User.findOne.throws()

    const req = {
      body: {
        email: "test@test.com",
        password: "tester",
      },
    };

     AuthController.login(req, {}, () => {}).then((result) => {
        expect(result).to.be.an("error");
        expect(result).to.have.property("statusCode", 500);
        done();
      })

      User.findOne.restore();
  });


  it('should send a response with a valid user status for an existing user', function(done) {
    const req = {userId: '5c0f66b979af55031b34728a'}
    const res = {
      statusCode: 500,
      userStatus: null,
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.userStatus = data.status;
      }
    }

    AuthController.getUserStatus(req, res, () => {}).then(() => {
      expect(res.statusCode).to.be.equal(200);
      expect(res.userStatus).to.be.equal('I am new!');
       done()
    })
  })

   after(function(done){
    User.deleteMany({}).then(() => {
      return mongoose.disconnect()
    }).then(() => {
      done()
    })
   })
});