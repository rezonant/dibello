import { annotateFn } from '../utils/annotate-fn';
import { suite } from 'razmin';
import { expect } from 'chai';

suite(describe => {
	describe('annotateFn', it => {
		it('should work with a parameterless function', function() {
			var metadata = annotateFn(function() { });
			expect(typeof metadata.fn).to.equal('function');
		});
		it('should work with a 1-parameter function', function() {
			var metadata = annotateFn(function(x) { });
			expect(typeof metadata.fn).to.equal('function');
			expect(metadata.params.length).to.equal(1);
			expect(metadata.params[0]).to.equal('x');
		});
		it('should work with a 2-parameter function', function() {
			var metadata = annotateFn(function(a,b) { });
			expect(typeof metadata.fn).to.equal('function');
			expect(metadata.params.length).to.equal(2);
			expect(metadata.params[0]).to.equal('a');
			expect(metadata.params[1]).to.equal('b');
		});
		it('should work with a declarative injection function', function() {
			var metadata = annotateFn(['a', 'b', 'c', function() { }]);
			expect(typeof metadata.fn).to.equal('function');
			expect(metadata.params.length).to.equal(3);
			expect(metadata.params[0]).to.equal('a');
			expect(metadata.params[1]).to.equal('b');
			expect(metadata.params[2]).to.equal('c');
		});
	});
});