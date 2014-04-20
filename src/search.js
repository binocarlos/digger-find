var utils = require('digger-utils');
var Selector = require('digger-selector');

module.exports.searcher = search;
module.exports.compiler = compile;

var attr_compare_functions = {
  "=":function(check, target){
    return check!=null && check==target;
  },
  "!=":function(check, target){
    return check!=null && check!=target;
  },
  ">":function(check, target){
    target = parseFloat(target);
    return check!=null && !isNaN(target) ? check > target : false;
  },
  ">=":function(check, target){
    target = parseFloat(target);
    return check!=null && !isNaN(target) ? check >= target : false;
  },
  "<":function(check, target){
    target = parseFloat(target);
    return check!=null && !isNaN(target) ? check < target : false;
  },
  "<=":function(check, target){
    target = parseFloat(target);
    return check!=null && !isNaN(target) ? check <= target : false;
  },
  "^=":function(check, target){
    return check!=null && check.match(new RegExp('^' + utils.escapeRegexp(target), 'i')) !== null;
  },
  "$=":function(check, target){
    return check!=null && check.match(new RegExp(utils.escapeRegexp(target) + '$', 'i')) !== null;
  },
  "~=":function(check, target){
    return check!=null && check.match(new RegExp('\\W' + utils.escapeRegexp(target) + '\\W', 'i')) !== null;
  },
  "|=":function(check, target){
    return check!=null && check.match(new RegExp('^' + utils.escapeRegexp(target) + '-', 'i')) !== null;
  },
  "*=":function(check, target){
    return check!=null && check.match(new RegExp(utils.escapeRegexp(target), 'i')) !== null;
  }
}


function val(model, field){
  var parts = field.split('.')
  var curr = model
  while(parts.length>0){
    var f = parts.shift()
    curr = curr[f]
    if(!curr){
      break
    }
  }
  return curr
}
/*

  Turn a selector object into a compiled function to have containers run through
  
 */

function compile(selector){

  if(typeof(selector)==='string'){
    selector = Selector(selector, true)
  }

  // return a function that will return boolean for a container matching this selector
  return function(container){

    var model;

    if(container._digger){
      model = container
    }
    else{
      model = container.get(0)
    }

    var digger = model._digger;

    // tells you if the given boolean should actuall be true
    // this allows the :not modifier to negate searches
    function notfilter(val){
      if(!val){
        val = false;
      }
      return selector.modifier && selector.modifier.not ? !val : val;
    }

    function notcountfilter(number){
      var orig = number || 0;
      var opposite = orig==0 ? 1 : 0;
      return selector.modifier && selector.modifier.not ? opposite : orig;
    }

    var hits = 0;

    // we step through one at a time - as soon as something fails we do not match

    // if we have a wildcard then we pass
    if(selector.tag=='*'){
      return notfilter(true);
    }

    if(selector.id){
      hits++;
    }

    if(selector.diggerid){
      hits++;
    }

    if(selector.tag){
      hits++;
    }

    // #id
    if(selector.id && notfilter(digger.id!=selector.id)){
      return false;
    }

    // =diggerid
    if(selector.diggerid && notfilter(digger.diggerid!=selector.diggerid)){
      return false;
    }

    // tagname
    if(selector.tag && notfilter(digger.tag!=selector.tag)){
      return false;
    }
  
    // classnames
    if(selector.class){
      var keys = Object.keys(selector.class || {});

      var vals = {}
      var arr = digger.class
      
      arr.forEach(function(c){
        vals[c] = true
      })
      var classcount = 0;
      keys.forEach(function(c){
        hits++;
        classcount += vals[c] ? notcountfilter(1) : notcountfilter(0);
      })

      if(classcount<keys.length){
        return false;
      }
    }

    if(selector.attr){

      var attr_count = 0;

      selector.attr.forEach(function(attr_filter){
        hits++;


        var check_value = val(model, attr_filter.field)
        //container.attr(attr_filter.field);
        var operator_function = attr_compare_functions[attr_filter.operator];

        // [size]
        if(!attr_filter.value){
          attr_count += check_value !== null ? notcountfilter(1) : notcountfilter(0);
        }
        // [size>100]
        else if(operator_function){
          attr_count += operator_function.apply(null, [check_value, attr_filter.value]) ? notcountfilter(1) : notcountfilter(0);
        }
        // no operator function found
      })

      if(attr_count<selector.attr.length){
        return false;
      }
    }

    // a 'they actually have nothing in the selector check'
    return hits>0;
  }
}

function search(selector, context){

  var selector_filter = compile(selector);

  var search_in = context;

  // we must now turn the search_from container into a flat array of the things to actually search

  // direct child mode
  if(selector.splitter=='>'){
    search_in = context.children();
  }
  // direct parent mode
  else if(selector.splitter=='<'){
    throw new Error('we do not support the parent splitter at the moment');
  }
  // all descendents mode
  else{
    search_in = context.descendents();
  }

  // now we loop each child container piping it via the selector filter
  var matchingmodels = search_in.containers().filter(selector_filter).map(function(container){
    return container.get(0);
  })

  var ret = search_in.spawn(matchingmodels);

  var modifier = selector.modifier || {};

  if(modifier.limit){
    var st = '' + modifier.limit;
    if(st.indexOf(',')>=0){
      var parts = st.split(',').map(function(stt){
        return stt.replace(/\D/g, '');
      })
      ret.models = ret.models.slice(parts[0], parts[1]);
    }
    else{
      ret.models = ret.models.slice(0, modifier.limit);
    }
    
  }

  if(modifier.first && ret.models.length>0){
    ret.models = [ret.models[0]];
  }
  else if(modifier.last && ret.models.length>0){
    ret.models = [ret.models[ret.models.length-1]];
  }

  return ret;
}