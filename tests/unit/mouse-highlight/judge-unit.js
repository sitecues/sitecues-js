var modulePath = '../../../source/js/mouse-highlight/judge.js',
    judge = require(modulePath),
    nodes = [],
    win,
    traits = require('../data/modules/mouse-highlight/traits');

require('../test/domutils');

describe('judge', function() {
    before(function() {
        function serializeNodeStack(start) {
            while (start !== win.document.body) {
                nodes.push(start);
                start = start.parentNode;
            }
        }

        domutils.loadHtml('./data/html/test-judgements.html', function(newWindow) {
            win = newWindow;
            serializeNodeStack(win.document.getElementById('0'));
        });
    });
    describe('#getJudgementStack', function() {
        it('should return an array of judgments with correct length.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack.length).to.be.equal(nodes.length);
            done();
        });
        it('should return |isGreatTag=false| judgement for a <p> element.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;
            traitStack[1].tag = 'p';
            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[1].isGreatTag).to.be.equal(false);
            done();
        });
        it('should return |isGoodTag=true| judgement for a <p>.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;
            traitStack[1].tag = 'p';
            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[1].isGoodTag).to.be.equal(true);
            done();
        });
        it('should return |isGoodTag=false| judgement for a <ul>.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[1].tag = 'ul';
            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[1].isGoodTag).to.be.equal(false);
            done();
        });
        it('should return |isGoodRole=true| judgement for an element with @role="listbox".', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;
            traitStack[1].role = 'listbox';
            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[1].isGoodRole).to.be.equal(true);
            done();
        });
        it('should return |isGoodRole=false| judgement for an element with @role="menuitem".', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[1].role = 'menuitem';
            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[1].isGoodRole).to.be.equal(false);
            done();
        });
        it('should return |hasOwnBackground=false| judgement when parent and child have same background.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values - ** each has same background **
                judgementStack;

            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[1].hasOwnBackground).to.be.equal(false);
            done();
        });
        it('should return |hasOwnBackground=true| when the current element has a background image.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[1].style.backgroundImage = 'something';
            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[1].hasOwnBackground).to.be.equal(true);
            done();
        });
        it('should return |hasOwnBackground=true| when the current element has a background color different from the parent.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[1].style.backgroundColor = 'rgba(99,99,99,1)';
            traitStack[2].style.backgroundColor = 'transparent'; // Parent
            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[1].hasOwnBackground).to.be.equal(true);
            done();
        });
        it('should return |percentOfViewportHeightUnderIdealMin=0| judgement for a element 50% as wide as the viewport.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[1].percentOfViewportHeight = 50;
            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[1].percentOfViewportHeightUnderIdealMin).to.be.equal(0);
            done();
        });
        it('should return |percentOfViewportHeightUnderIdealMin>0| judgement for an element 1% as tall as the viewport.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[1].percentOfViewportHeight = 1;
            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[1].percentOfViewportHeightUnderIdealMin > 0).to.be.equal(true);
            done();
        });
        it('should return |percentOfViewportHeightOverIdealMin=0| judgement for an element 10% as tall as the viewport.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[1].percentOfViewportHeight = 10;
            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[1].percentOfViewportWidthOverIdealMax).to.be.equal(0);
            done();
        });
        it('should return |percentOfViewportWidthOverIdealMax| judgement for an element 150% as wide as the viewport.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[1].percentOfViewportWidth = 150;
            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[1].percentOfViewportWidthOverIdealMax > 0).to.be.equal(true);
            done();
        });
        it('should return |tinyWidthFactor=0| judgement for an element 100px wide.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[1].visualWidthAt1x = 100;
            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[1].tinyWidthFactor).to.be.equal(0);
            done();
        });
        it('should return |tinyWidthFactor>0| judgement for an element 1px wide.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[1].visualWidthAt1x = 1;
            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[1].tinyWidthFactor > 0).to.be.equal(true);
            done();
        });
        it('should return |vertSeparationImpact=0| judgement for an element no top or bottom border/margin/padding.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack,
                index = 0;

            for (; index < 5; index ++ ) {
              traitStack[index].topBorder = 0;
              traitStack[index].bottomBorder = 0;
              traitStack[index].topPadding = 0;
              traitStack[index].bottomPadding = 0;
              traitStack[index].topMargin = 0;
              traitStack[index].bottomMargin = 0;
            }
            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[0].vertSeparationImpact).to.be.equal(0);
            done();
        });
        it('should return |vertSeparationImpact>0| judgement for an element with a top border.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[1].topBorder = 1;
            traitStack[1].bottomBorder = 0;
            traitStack[1].topSpacing = 0;
            traitStack[1].bottomSpacing = 0;
            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[1].vertSeparationImpact > 0).to.be.equal(true);
            done();
        });
        it('should return |badGrowthBottom=0| judgement for an element with the same bottom coordinate as its parent.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[1].unzoomedRect.bottom = 100;
            traitStack[2].unzoomedRect.bottom = 100; // Parent bottom is same as child's
            traitStack[1].bottomBorder = 1;

            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[1].badGrowthBottom).to.be.equal(0);
            done();
        });
        it('should return |badGrowthBottom=0| judgement for an element with no bottom border or spacing.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[1].unzoomedRect.bottom = 100;
            traitStack[2].unzoomedRect.bottom = 200; // Parent bottom is farther to right than child
            traitStack[1].bottomBorder = 0;
            traitStack[1].bottomSpacing = 0;

            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[1].badGrowthBottom).to.be.equal(0);
            done();
            it('should return |badGrowthBottomt>0| judgement for an element with a bottom border and right side deep inside the parent.', function(done) {
                var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                    judgementStack;

                traitStack[1].unzoomedRect.bottom = 100;
                traitStack[2].unzoomedRect.bottom = 999; // Parent right-side is farther to right than child
                traitStack[1].rightBottom = 1;

                judgementStack = judge.getJudgementStack(traitStack, nodes);
                expect(judgementStack[1].badGrowthBottom> 0).to.be.equal(true);
                done();
            });
        });
        it('should return |large2dGrowth > 0| judgement for an element much taller and wider than the deepest descendant with display="block".', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[0].style.display = 'inline';
            traitStack[1].style.display = 'block';
            traitStack[1].style.display = 'block';
            traitStack[1].fullWidth = 100;
            traitStack[1].rect.height = 100;
            traitStack[4].style.display = 'block';
            traitStack[4].fullWidth = 1000;
            traitStack[4].rect.height = 1000;
            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[4].large2dGrowth > 0).to.be.equal(true);
            done();
        });
        it('should return |large2dGrowth=0| judgement for an element not much taller than the deepest descendant with display="block".', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[0].normDisplay = 'inline';
            traitStack[1].normDisplay = 'block';
            traitStack[1].fullWidth = 100;
            traitStack[1].rect.height = 100;
            traitStack[4].normDisplay = 'block';
            traitStack[4].fullWidth = 1000;
            traitStack[4].rect.height = 101;
            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[4].large2dGrowth).to.be.equal(false);
            done();
        });
        it('should return |large2dGrowth=0| judgement for an element not much wider than the deepest descendant with display="block".', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[0].normDisplay = 'inline';
            traitStack[1].style.display = 'block';
            traitStack[1].fullWidth = 100;
            traitStack[1].rect.height = 100;
            traitStack[4].normDisplay = 'block';
            traitStack[4].fullWidth = 101;
            traitStack[4].rect.height = 1000;
            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[4].large2dGrowth).to.be.equal(false);
            done();
        });
        it('should return |isCellInRow=true| judgement when conditions are right for a floating cell.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[3].style.float = 'none';
            traitStack[2].style.float = 'left';
            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[2].isCellInRow).to.be.equal(true);
            done();
        });
        it('should return |isCellInRow=true| judgement when conditions are right.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[2].percentOfViewportWidth = 15;
            traitStack[2].leftBorder = 2;
            traitStack[2].rightBorder = 2;
            judgementStack = judge.getJudgementStack(traitStack, nodes);

            expect(judgementStack[2].isCellInRow).to.be.equal(true);
            done();
        });
        it('should return |isCellInRow=false| judgement when conditions are wrong.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[2].percentOfViewportWidth = 15;
            traitStack[2].leftBorder = 0;
            traitStack[2].rightBorder = 0;

            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[2].isCellInRow).to.be.equal(false);
            done();
        });
        it('should return |isCellInCol=true| judgement when conditions are right.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[3].fullWidth = traitStack[2].fullWidth;
            traitStack[3].rect.width = traitStack[2].rect.width;
            traitStack[3].unzoomedRect.width = traitStack[2].unzoomedRect.width;
            traitStack[3].visualWidthAt1x = traitStack[2].visualWidthAt1x;
            traitStack[3].rect.height = 3 * traitStack[2].rect.height;
            traitStack[3].unzoomedRect.height = 3 * traitStack[2].unzoomedRect.height;
            traitStack[3].visualHeightAt1x = 3 * traitStack[2].visualHeightAt1x;
            traitStack[2].percentOfViewportHeight = 15;
            traitStack[2].topBorder = 2;
            traitStack[2].bottomBorder = 2;

            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[2].isCellInCol).to.be.equal(true);
            done();
        });
        it('should return |isCellInCol=false| judgement when conditions are wrong.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

          traitStack[3].fullWidth = 2 * traitStack[2].fullWidth;
          traitStack[3].rect.width = 2 * traitStack[2].rect.width;
          traitStack[3].unzoomedRect.width = 2 * traitStack[2].unzoomedRect.width;
          traitStack[3].visualWidthAt1x = 2* traitStack[2].visualWidthAt1x;
          traitStack[3].rect.height = 3 * traitStack[2].rect.height;
          traitStack[3].unzoomedRect.height = 3 * traitStack[2].unzoomedRect.height;
          traitStack[3].visualHeightAt1x = 3 * traitStack[2].visualHeightAt1x;
          traitStack[2].percentOfViewportHeight = 15;

          judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[2].isCellInCol).to.be.equal(false);
            done();
        });
        it('should return |isAncestorOfCell=true| judgement for the ancestor of an element judged to be a cell.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[2].percentOfViewportWidth = 15;
            traitStack[2].leftBorder = 2;
            traitStack[2].rightBorder = 2;

            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[3].isAncestorOfCell).to.be.equal(true);
            done();
        });
        it('should return |isAncestorOfCell=false| judgement for an element with no descendant cells.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[3].isAncestorOfCell).to.be.equal(false);
            done();
        });
        it('should return |isWideAncestorOfCell=true| judgement for a wide ancestor of an element judged to be a cell.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[2].percentOfViewportWidth = 15;
            traitStack[2].leftBorder = 2;
            traitStack[2].rightBorder = 2;
            traitStack[2].percentOfViewportWidth = 50;
            traitStack[3].percentOfViewportWidth = 150;

            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[3].isWideAncestorOfCell).to.be.equal(true);
            done();
        });
        it('should return |isWideAncestorOfCell=false| judgement for a narrow ancestor of an element judged to be a cell.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;
          traitStack[2].percentOfViewportWidth = 15;
          traitStack[2].leftBorder = 2;
          traitStack[2].rightBorder = 2;
          traitStack[2].percentOfViewportWidth = 30;
          traitStack[3].percentOfViewportWidth = 50;

            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[3].isWideAncestorOfCell).to.be.equal(false);
            done();
        });
        it('should return |isGroupedWithImage=true| judgement for an element with an image descendant.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[1].childCount = 4;
            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[1].isGroupedWithImage).to.be.equal(true);
            done();
        });
        it('should return |isGroupedWithImage=false| judgement for an element with two image descendants.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[2].isGroupedWithImage).to.be.equal(false);
            done();
        });
        it('should return |isSectionStartContainer=true| judgement for an element with a heading in the chain of first child nodes.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[2].isSectionStartContainer).to.be.equal(true);
            done();
        });
        it('should return |isSectionStartContainer=false| judgement for an element with no heading descendants.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[1].isSectionStartContainer).to.be.equal(false);
            done();
        });
        it('should return |isDividedInHalf=false| judgement for an element without any dividing descendants.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[1].isDividedInHalf).to.be.equal(false);
            done();
        });
        it('should return |isDividedInHalf=true| judgement for an element an <hr> middle child.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[2].isDividedInHalf).to.be.equal(true);
            done();
        });
        it('should return |isLargeWidthExpansion=true| judgement for an element much wider than the first non-inline descendant.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[0].normDisplay = 'inline';
            traitStack[1].normDisplay = 'block';
            traitStack[1].fullWidth = 500;
            traitStack[3].fullWidth = 5000;
            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[3].isLargeWidthExpansion).to.be.equal(true);
            done();
        });
        it('should return |isLargeWidthExpansion=true| judgement for an element about the same width as the first non-inline descendant.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[0].normDisplay = 'inline';
            traitStack[1].normDisplay = 'block';
            traitStack[1].fullWidth = 500;
            traitStack[3].fullWidth = 550;
            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[3].isLargeWidthExpansion).to.be.equal(false);
            done();
        });
        it('should return |isWideMediaContainer=true| judgement for a item that is very wide and marked as media.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[1].isVisualMedia = true;
            traitStack[1].percentOfViewportWidth = 200;
            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[1].isWideMediaContainer).to.be.equal(true);
            done();
        });
        it('should return |isWideMediaContainer=true| judgement for the parent of an item that is very wide and marked as media.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[1].isVisualMedia = true;
            traitStack[1].percentOfViewportWidth = 200;
            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[2].isWideMediaContainer).to.be.equal(true);
            done();
        });
        it('should return |isWideMediaContainer=true| judgement for a item that is very narrow and marked as media.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[1].isVisualMedia = true;
            traitStack[1].percentOfViewportWidth = 10;
            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[1].isWideMediaContainer).to.be.equal(false);
            done();
        });
        it('should return |isWideMediaContainer=false| judgement for a item that is very wide and marked as not being media.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[1].isVisualMedia = false;
            traitStack[1].percentOfViewportWidth = 200;
            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[1].isWideMediaContainer).to.be.equal(false);
            done();
        });
        it('should return |isFormControl=true| judgement for a form control.', function(done) {
          var newNodes = nodes.slice(), // Duplicate
            FORM_CONTROL_ID = 'test-input';
          newNodes[0] = win.document.getElementById(FORM_CONTROL_ID);
          var traitStack = traits.getTraitStack(newNodes), // Mock traits, not real values
            judgementStack;

          judgementStack = judge.getJudgementStack(traitStack, newNodes);
          expect(judgementStack[0].isFormControl).to.be.equal(true);
          done();
        });
        it('should return |isFormControl=false| judgement for a non-form control.', function(done) {
          var traitStack = traits.getTraitStack(nodes), // Default node stack has no form input
            judgementStack;

          judgementStack = judge.getJudgementStack(traitStack, nodes);
          expect(judgementStack[0].isFormControl).to.be.equal(false);
          done();
        });
        it('should return |nearBodyWidthFactor=0| for a narrow-width element.', function(done) {
          var traitStack = traits.getTraitStack(nodes), // Default node stack has no form input
            judgementStack;

          traitStack[1].percentOfBodyWidth = 15;
          judgementStack = judge.getJudgementStack(traitStack, nodes);
          expect(judgementStack[1].nearBodyWidthFactor).to.be.equal(0);
          done();
        });
      it('should return |nearBodyWidthFactor = 0| for a wide-width element when there is no good narrow child to pick.', function(done) {
        var traitStack = traits.getTraitStack(nodes), // Default node stack has no form input
          judgementStack;

        traitStack[1].percentOfBodyWidth = 98;
        judgementStack = judge.getJudgementStack(traitStack, nodes);
        expect(judgementStack[1].nearBodyWidthFactor).to.be.equal(0)
        done();
      });
      it('should return |nearBodyWidthFactor > 0| for a wide-width element.', function(done) {
        var traitStack = traits.getTraitStack(nodes), // Default node stack has no form input
          judgementStack;

        traitStack[0].rect.width = 50;
        traitStack[1].rect.width = 500;
        traitStack[1].percentOfBodyWidth = 98;
        judgementStack = judge.getJudgementStack(traitStack, nodes);
        expect(judgementStack[1].nearBodyWidthFactor > 0).to.be.true;
        done();
      });
    });
    after(function() {
        // Unload module from nodejs's cache
        var name = require.resolve(modulePath);
        delete require.cache[name];
    });
});