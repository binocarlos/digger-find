var api = require('../src')
var Container = require('digger-container');
var citydata = require('./fixtures/cities.json');


function augment_prototype(api){
  for(var prop in api){
    Container.prototype[prop] = api[prop];
  }
}

augment_prototype(api);

describe('digger-find', function(){

  it('should run selectors on local data', function() {

    var test = Container(citydata);

    var results = test.find('city.south');
    results.count().should.equal(3);

    var results2 = test.find('country[name^=U] > city.south area.poor');
    results2.count().should.equal(3);

  })
  
  it('should apply limit and first and last modifiers', function() {
    var test = Container(citydata);
    test.find('city.south').count().should.equal(3);    
    test.find('city.south:first').count().should.equal(1);
    test.find('city.south:last').count().should.equal(1);
    test.find('city.south:limit(2)').count().should.equal(2);
  })


  it('should do a not selector', function() {

    var test = Container(citydata);

    var cities = test.find('city:not');

    cities.each(function(city){
      (city.tag()=='city').should.equal(false);
    })

    
  })

})
