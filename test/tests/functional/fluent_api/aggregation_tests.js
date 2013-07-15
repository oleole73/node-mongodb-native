var fs = require('fs')
	, stream = require('stream');

exports['Should correctly perform a simple pipe aggregation command and get'] = function(configuration, test) {
  var db = configuration.db();
  var col = db.collection('fluent_api');

  // Insert a couple of docs
  var docs = [];
  for(var i = 0; i < 10; i++) docs.push({agg_pipe: i});

  // Simple insert
  col.insert(docs, function(err, result) {
    test.equal(null, err);

    // Execute the aggregation
    col.pipe().find({agg_pipe: {$gt: 5}}).get(function(err, results) {
    	test.equal(null, err);
    	test.equal(4, results.length);
	    test.done();
    });
  });
}

exports['Should correctly perform a simple pipe aggregation command and getOne'] = function(configuration, test) {
  var db = configuration.db();
  var col = db.collection('fluent_api');

  // Insert a couple of docs
  var docs = [];
  for(var i = 0; i < 10; i++) docs.push({agg_pipe2: i});

  // Simple insert
  col.insert(docs, function(err, result) {
    test.equal(null, err);

    // Execute the aggregation
    col.pipe().find({agg_pipe2: {$gt: 5}}).getOne(function(err, result) {
    	test.equal(null, err);
    	test.equal(6, result.agg_pipe2);
	    test.done();
    });
  });
}

exports['Should correctly perform a complete pipe aggregation command and get'] = function(configuration, test) {
  var db = configuration.db();
  var col = db.collection('fluent_api');

  // Some docs for insertion
  var docs = [{
      title : "this is my title", author : "bob", posted : new Date() ,
      pageViews : 5, tags : [ "fun" , "good" , "fun" ], other : { foo : 5 },
      comments : [
        { author :"joe", text : "this is cool" }, { author :"sam", text : "this is bad" }
      ]}];

  // Simple insert
  col.insert(docs, function(err, result) {
    test.equal(null, err);

    // Execute the aggregation
    col.pipe()
    	 .project({author:1, tags:1})
    	 .unwind("$tags")
    	 .group({
    	 		_id: {tags: "$tags"}
    	 	,	authors: { $addToSet: "$author" }
    	 })
    	 .limit(1)
    	 .skip(0)
    	 .withReadPreference('secondary')
    	 .get(function(err, results) {
	    	 test.equal(null, err);
	    	 test.deepEqual([ { _id: { tags: 'good' }, authors: [ 'bob' ] } ], results);
		     test.done();
    	 });
  });
}

exports['Should correctly perform a simple pipe aggregation command and explain'] = function(configuration, test) {
  var db = configuration.db();
  var col = db.collection('fluent_api');

  // Insert a couple of docs
  var docs = [];
  for(var i = 0; i < 10; i++) docs.push({agg_pipe3: i});

  // Simple insert
  col.insert(docs, function(err, result) {
    test.equal(null, err);

    // Execute the aggregation
    col.pipe().find({agg_pipe3: {$gt: 5}}).explain(function(err, result) {
    	test.equal(null, err);
    	test.ok(result[0].query != null);
    	test.ok(result[0].cursor != null);
	    test.done();
    });
  });
}

exports['Should correctly perform a simple pipe aggregation command and print as stream'] = function(configuration, test) {
  var db = configuration.db();
  var col = db.collection('fluent_api');
	var liner = new stream.Transform( { objectMode: true } )

	// Add tranformer
	liner._transform = function(object, encoding, done) {
		this.push(JSON.stringify(object));
		done();
	}

  // Insert a couple of docs
  var docs = [];
  for(var i = 0; i < 10; i++) docs.push({agg_pipe4: i});

  // Simple insert
  col.insert(docs, function(err, result) {
    test.equal(null, err);

    // Execute the aggregation
    var agg_stream = col.pipe().find({agg_pipe4: {$gt: 0}});
    var file_stream = fs.createWriteStream(process.cwd() + '/agg.tmp');
    liner.pipe(file_stream);
    agg_stream.pipe(liner);
    file_stream.on('close', function() {

    	// Get all the results
	    col.pipe().find({agg_pipe4: {$gt: 0}}).get(function(err, items) {
	    	test.equal(null, err);
	    	var str = '';

	    	for(var i = 0; i < items.length; i++) {
	    		str += JSON.stringify(items[i]);
	    	}

	    	var str2 = fs.readFileSync(process.cwd() + '/agg.tmp', 'utf8');
	    	test.equal(str2, str);
	    	test.done();
	    });
    });
  });
}
