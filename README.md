digger-find
===========

![Build status](https://api.travis-ci.org/binocarlos/digger-find.png)

The client side find function for digger container trees.

## Examples

### find
Find containers in local data:

```js
var children_data = [{
	name:"Superman",
	rating:7.8,
	_children:[{
		name:"flying"
	},{
		name:"strength"
	}]
},{
	name:"Spiderman",
	rating:7.9,
	_children:[{
		name:"spinwebs"
	},{
		name:"spidersense"
	}]
}]

var superheroes = Container(children_data);

var spiderman = superheroes.find('[rating=7.9]');
```

### sort
Sort containers by function or fieldname - asc only at present:

By field:

```js
var superheroes = Container(children_data);

// title is default
var byname = superheroes.sort();

// sort by fieldname
var byrating = superheroes.sort('rating');
```

### filter
Return a container with the models that return true from the provided function

If the function is a string then do 'container.match' on it.

By field:

```js
var superheroes = Container(children_data);

var some = superheroes.filter(function(hero){
	return hero.hasClass('super');
})

var byselector = superheroes.filter('.super');
```

### match
Returns true if a given container matches the given selector.

```js
var superheroes = Container(children_data);

var spiderman = superheroes.eq(1);

if(spiderman.match('.super')){
	// spiderman is super!
}
```
