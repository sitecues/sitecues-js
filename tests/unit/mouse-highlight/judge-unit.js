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
        it('should return |isGreatTag=true| judgement for a <ul>.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[1].tag = 'ul';
            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[1].isGreatTag).to.be.equal(true);
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

            traitStack[1].visualWidth = 100;
            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[1].tinyWidthFactor).to.be.equal(0);
            done();
        });
        it('should return |tinyWidthFactor>0| judgement for an element 1px wide.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[1].visualWidth = 1;
            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[1].tinyWidthFactor > 0).to.be.equal(true);
            done();
        });
        it('should return |vertSeparationImpact=0| judgement for an element no top or bottom border/spacing.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[1].topBorder = 0;
            traitStack[1].bottomBorder = 0;
            traitStack[1].topSpacing = 0;
            traitStack[1].bottomSpacing = 0;
            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[1].vertSeparationImpact).to.be.equal(0);
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
        it('should return |badGrowthRight=0| judgement for an element with the same right coordinate as its parent.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[1].unzoomedRect.right = 100;
            traitStack[2].unzoomedRect.right = 100; // Parent right-side is same as child's
            traitStack[1].rightBorder = 1;

            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[1].badGrowthRight).to.be.equal(0);
            done();
        });
        it('should return |badGrowthRight=0| judgement for an element with no right border or spacing.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[1].unzoomedRect.right = 100;
            traitStack[2].unzoomedRect.right = 200; // Parent right-side is farther to right than child
            traitStack[1].rightBorder = 0;
            traitStack[1].rightSpacing = 0;

            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[1].badGrowthRight).to.be.equal(0);
            done();
            it('should return |badGrowthRight>0| judgement for an element with a right border and right side deep inside the parent.', function(done) {
                var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                    judgementStack;

                traitStack[1].unzoomedRect.right = 100;
                traitStack[2].unzoomedRect.right = 999; // Parent right-side is farther to right than child
                traitStack[1].rightBorder = 1;

                judgementStack = judge.getJudgementStack(traitStack, nodes);
                expect(judgementStack[1].badGrowthRight > 0).to.be.equal(true);
                done();
            });
        });
        it('should return |isLarge2dGrowth=true| judgement for an element much taller and wider than the deepest descendant with display="block".', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[0].style.display = 'inline';
            traitStack[1].style.display = 'block';
            traitStack[1].style.display = 'block';
            traitStack[1].visualWidth = 100;
            traitStack[1].visualHeight = 100;
            traitStack[4].style.display = 'block';
            traitStack[4].visualWidth = 1000;
            traitStack[4].visualHeight = 1000;
            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[4].isLarge2dGrowth).to.be.equal(true);
            done();
        });
        it('should return |isLarge2dGrowth=false| judgement for an element not much taller than the deepest descendant with display="block".', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[0].style.display = 'inline';
            traitStack[1].style.display = 'block';
            traitStack[1].style.display = 'block';
            traitStack[1].visualWidth = 100;
            traitStack[1].visualHeight = 100;
            traitStack[4].style.display = 'block';
            traitStack[4].visualWidth = 1000;
            traitStack[4].visualHeight = 101;
            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[4].isLarge2dGrowth).to.be.equal(false);
            done();
        });
        it('should return |isLarge2dGrowth=false| judgement for an element not much wider than the deepest descendant with display="block".', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[0].style.display = 'inline';
            traitStack[1].style.display = 'block';
            traitStack[1].style.display = 'block';
            traitStack[1].visualWidth = 100;
            traitStack[1].visualHeight = 100;
            traitStack[4].style.display = 'block';
            traitStack[4].visualWidth = 101;
            traitStack[4].visualHeight = 1000;
            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[4].isLarge2dGrowth).to.be.equal(false);
            done();
        });
        it('should return |isModeratelyLargerThanChildInOneDimension=true| judgement for an element slightly taller than its child.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[1].visualWidth = 100;
            traitStack[1].visualHeight = 100;
            traitStack[2].visualWidth = 125;
            traitStack[2].visualHeight = 100;
            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[2].isModeratelyLargerThanChildInOneDimension).to.be.equal(true);
            done();
        });
        it('should return |isModeratelyLargerThanChildInOneDimension=true| judgement for an element much taller than its child.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[1].visualWidth = 100;
            traitStack[1].visualHeight = 100;
            traitStack[2].visualWidth = 1000;
            traitStack[2].visualHeight = 100;
            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[2].isModeratelyLargerThanChildInOneDimension).to.be.equal(false);
            done();
        });
        it('should return |isFloatForCellLayout=true| judgement when conditions are right.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[1].style.float = 'right';
            traitStack[1].visualWidth = 50;
            traitStack[1].visualHeight = 50;
            traitStack[2].visualWidth = 500;
            traitStack[2].visualHeight = 50;

            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[1].isFloatForCellLayout).to.be.equal(true);
            done();
        });
        it('should return |isCellInRow=true| judgement when conditions are right.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[1].visualWidth = 50;
            traitStack[1].visualHeight = 50;
            traitStack[1].percentOfViewportWidth = 5;
            traitStack[1].percentOfViewportHeight = 5;
            traitStack[1].rightBorder = 5;
            traitStack[2].visualWidth = 500;
            traitStack[2].visualHeight = 50;
            traitStack[2].percentOfViewportWidth = 50;
            traitStack[2].percentOfViewportHeight = 5;

            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[1].isCellInRow).to.be.equal(true);
            done();
        });
        it('should return |isCellInRow=false| judgement when conditions are wrong.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[1].visualWidth = 50;
            traitStack[1].visualHeight = 50;
            traitStack[1].percentOfViewportWidth = 5;
            traitStack[1].percentOfViewportHeight = 5;
            traitStack[1].rightBorder = 5;
            traitStack[2].visualWidth = 60;
            traitStack[2].visualHeight = 50;
            traitStack[2].percentOfViewportWidth = 6;
            traitStack[2].percentOfViewportHeight = 5;

            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[1].isCellInRow).to.be.equal(false);
            done();
        });
        it('should return |isCellInCol=true| judgement when conditions are right.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[1].visualWidth = 50;
            traitStack[1].visualHeight = 150;
            traitStack[1].percentOfViewportWidth = 5;
            traitStack[1].percentOfViewportHeight = 15;
            traitStack[1].topBorder = 5;
            traitStack[2].visualWidth = 50;
            traitStack[2].visualHeight = 500;
            traitStack[2].percentOfViewportWidth = 5;
            traitStack[2].percentOfViewportHeight = 50;

            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[1].isCellInCol).to.be.equal(true);
            done();
        });
        it('should return |isCellInCol=false| judgement when conditions are wrong.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[1].visualWidth = 50;
            traitStack[1].visualHeight = 150;
            traitStack[1].percentOfViewportWidth = 5;
            traitStack[1].percentOfViewportHeight = 15;
            traitStack[1].topBorder = 5;
            traitStack[2].visualWidth = 50;
            traitStack[2].visualHeight = 150;
            traitStack[2].percentOfViewportWidth = 5;
            traitStack[2].percentOfViewportHeight = 15;

            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[1].isCellInCol).to.be.equal(false);
            done();
        });
        it('should return |isAncestorOfCell=true| judgement for the ancestor of an element judged to be a cell.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[1].visualWidth = 50;
            traitStack[1].visualHeight = 50;
            traitStack[1].percentOfViewportWidth = 5;
            traitStack[1].percentOfViewportHeight = 5;
            traitStack[1].rightBorder = 5;
            traitStack[2].visualWidth = 500;
            traitStack[2].visualHeight = 50;
            traitStack[2].percentOfViewportWidth = 50;
            traitStack[2].percentOfViewportHeight = 5;

            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[3].isAncestorOfCell).to.be.equal(true);
            done();
        });
        it('should return |isAncestorOfCell=true| judgement for an element with no descendant cells.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[3].isAncestorOfCell).to.be.equal(false);
            done();
        });
        it('should return |isWideAncestorOfCell=true| judgement for a wide ancestor of an element judged to be a cell.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[1].visualWidth = 50;
            traitStack[1].visualHeight = 50;
            traitStack[1].percentOfViewportWidth = 5;
            traitStack[1].percentOfViewportHeight = 5;
            traitStack[1].rightBorder = 5;
            traitStack[2].visualWidth = 500;
            traitStack[2].visualHeight = 50;
            traitStack[2].percentOfViewportWidth = 50;
            traitStack[2].percentOfViewportHeight = 5;
            traitStack[3].percentOfViewportWidth = 150;

            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[3].isWideAncestorOfCell).to.be.equal(true);
            done();
        });
        it('should return |isWideAncestorOfCell=false| judgement for a narrow ancestor of an element judged to be a cell.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[1].visualWidth = 50;
            traitStack[1].visualHeight = 50;
            traitStack[1].percentOfViewportWidth = 5;
            traitStack[1].percentOfViewportHeight = 5;
            traitStack[1].rightBorder = 5;
            traitStack[2].visualWidth = 500;
            traitStack[2].visualHeight = 50;
            traitStack[2].percentOfViewportWidth = 50;
            traitStack[2].percentOfViewportHeight = 5;
            traitStack[3].percentOfViewportWidth = 40;

            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[3].isWideAncestorOfCell).to.be.equal(false);
            done();
        });
        it('should return |isGroupedWithImage| judgement for an element with an image descendant.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[1].isGroupedWithImage).to.be.equal(true);
            done();
        });
        it('should return |isGroupedWithImage| judgement for an element with two image descendants.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[3].isGroupedWithImage).to.be.equal(false);
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
        it('should return |isDivided=false| judgement for an element without any dividing descendants.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[1].isDivided).to.be.equal(false);
            done();
        });
        it('should return |isDivided=true| judgement for an element an <hr> middle child.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[2].isDivided).to.be.equal(true);
            done();
        });
        it('should return |isLargeWidthExpansion=true| judgement for an element much wider than the first non-inline descendant.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[0].normDisplay = 'inline';
            traitStack[1].normDisplay = 'block';
            traitStack[1].visualWidth = 500;
            traitStack[3].visualWidth = 5000;
            judgementStack = judge.getJudgementStack(traitStack, nodes);
            expect(judgementStack[3].isLargeWidthExpansion).to.be.equal(true);
            done();
        });
        it('should return |isLargeWidthExpansion=true| judgement for an element about the same width as the first non-inline descendant.', function(done) {
            var traitStack = traits.getTraitStack(nodes), // Mock traits, not real values
                judgementStack;

            traitStack[0].normDisplay = 'inline';
            traitStack[1].normDisplay = 'block';
            traitStack[1].visualWidth = 500;
            traitStack[3].visualWidth = 550;
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