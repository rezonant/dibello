
window.IDBCursor.prototype.hydrate = function(hydrator) {
	var self = this;

	var hydrationCursor = {
		yields: [],
		finishers: [],
		catchers: [],
		
		yield: function(cb) {
			this.yields.push(cb);
		},
		finishes: function(cb) {
			this.finishers.push(cb);
		},
		catch: function(cb) {
			this.catchers.push(cb);
		}
	};

	var uponCatch = function(err) {
		var catchers = hydrationCursor.yields;
		for (var i = 0, max = yields.length; i < max; ++i) {
			catchers[i].apply(hydrationCursor, [err]);
		}
	};

	var uponYield = function(item) {
		var yields = hydrationCursor.yields;
		for (var i = 0, max = yields.length; i < max; ++i) {
			yields[i].apply(hydrationCursor, [item]);
		}
	};
	
	var uponFinish = function(items) {
		var finishers = hydrationCursor.finishers;
		for (var i = 0, max = finishers.length; i < max; ++i) {
			finishers[i].apply(hydrationCursor, [items]);
		}
	};

	var result;
	
	this
		.yield(function(item) {
			hydrator(item).then(function(hydratedItem) {
				result.push(hydratedItem);
				uponYield(hydratedItem);
			});
		})
		.finishes(function(value) {
			uponFinish(result);
			})
		.catch(function(err) {
			uponCatch(err);
		});
		
	return hydrationCursor;
};
