/**
 * util.js - Tests the util file under /helpers/util.js
 * @author eLIPSE
 */

var assert = require('chai').assert;
var db = require('../controllers/database');
var util = require('../helpers/util.js');

describe('Utility', function() {
   describe('objectLength', function() {
        it("objectLength should work for various arrays of elements", function() {
            assert.equal(util.objectLength([1, 2, 3, 4]), 4);
        });

        it("objectLength should work for various arrays of elements", function() {
            assert.equal(util.objectLength([]), 0);
        });

        it("objectLength should work for various arrays of elements", function() {
            assert.equal(util.objectLength(['a', 'b', 'c']), 3);
        });

        it("objectLength should work for various arrays of elements", function() {
            assert.equal(util.objectLength([{}]), 1);
        });

        it("objectLength should work for various strings", function() {
            assert.equal(util.objectLength(""), 0);
            assert.equal(util.objectLength("pineapple"), 9);
            assert.equal(util.objectLength("donald"), 6);
            assert.equal(util.objectLength("trump"), 5);
        });

        it("objectLength should work for various objects", function() {
            var a = {a: 1, b: 5};
            var b = {};
            var c = {a: {}};
            
            assert.equal(util.objectLength(a), 2);
            assert.equal(util.objectLength(b), 0);
            assert.equal(util.objectLength(c), 1);
        });
   });

   describe('randomInteger', function() {
        var num;
        for (var i = 0; i < 15; i++) {
            num = util.randomInteger(1, 100);
            it ("randomInteger returned a integer (" + num + ")", function() {
                assert.equal(num % 1, 0);
            });
        }
   });

   describe('contains', function() {
        var a = [1, 2, 3, 4];
        var b = ['a', 'b'];
        var c = [];
        var d = ['a'];

        it("contains found value in numerical array", function() {
            assert.equal(util.contains(a, 2), true);
        });

        it("contains returned false for a non existant variable in numerical array", function() {
            assert.equal(util.contains(a, 5), false);
        });

        it("contains found value in string array", function() {
            assert.equal(util.contains(b, 'a'), true);
        });

        it("contains a non existent value in string array", function() {
            assert.equal(util.contains(b, 'c'), false);
        });

        it("contains did not find item in empty array", function() {
            assert.equal(util.contains(c, 2), false);
        });

        it("contains did not find item in empty array", function() {
            assert.equal(util.contains(c, 'a'), false);
        });

        it("contains did not find item in empty array", function() {
            assert.equal(util.contains(c, ''), false);
        });

        it("contains found element in single element array", function() {
            assert.equal(util.contains(d, 'a'), true);
        });

        it("contains did not find element in single element array", function() {
            assert.equal(util.contains(d, 'b'), false);
        });

   });

   describe('contains large', function() {
        var e = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

        e.forEach(function(i) {
            it("contains found correct element " + (i - 1) + " in position of large array", function(done) {
                assert.equal(util.contains(e, i), true);
                i++;
                done();
            });
        });
   });


});
