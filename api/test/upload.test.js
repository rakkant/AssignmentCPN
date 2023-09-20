const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app');
const expect = chai.expect;
const path = require('path');

chai.use(chaiHttp);

describe('File Upload API', () => {
  const filePath = path.join(__dirname, '..', 'public', 'files', 'testfile.txt');

  it('should upload a file', function (done) {
    this.timeout(10000); 
    chai
      .request(app)
      .post('/api/upload')
      .attach('file', filePath)
      .end((err, res) => {
        if (err) {
          console.error(err);
          done(err);
        } else {
          console.log(res.status);
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('message').that.includes('File uploaded successfully');
          done();
        }
      });
  });

  it('should get a list of files', (done) => {
    chai
      .request(app)
      .get('/api/files')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('files').to.be.an('array');
        done();
      });
  });

  it('should delete a file', function (done) {
    this.timeout(10000); 
    const fileName = 'testfile.txt'; 

    chai
      .request(app)
      .delete(`/api/files/${fileName}`)
      .end((err, res) => {
        if (err) {
          console.error(err);
          done(err);
        } else {
          console.log(res.status);
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('message').that.includes('File deleted successfully');
          done();
        }
      });
  });
});
