// module with useful methods to determine
// what type of element something is
eqnx.def('caret/classifier', function(classifier, callback){

	classifier.editingInputTypes = {
		'text': true,
		'password': true,
		'search': true,
		'color': true,
		'date': true,
		'datetime': true,
		'datetime-local': true,
		'email': true,
		'month': true,
		'number': true,
		'tel': true,
		'time': true,
		'url': true,
		'week': true
	};

	classifier.isEditableWithNativeCaret = function(element){
		if (!element instanceof HTMLElement){
			return false;
		}

		var htmlElement = element;
		var tag = htmlElement.localName;

		if (tag){
			tag = tag.toLowerCase();
		}

		// HTML input checks
		if (tag === 'input'){
			var type = htmlElement.getAttribute('type');
			if(!type || classifier.editingInputTypes.hasOwnProperty(type)){
				return true;
			}

			return false; // Unknown input type
		}

		if (tag === 'textarea'){
			return true;
		}

		// Check for rich text editor
		var contentEditable = htmlElement.getAttribute('contenteditable');
		if (contentEditable && contentEditable.toLowerCase() !== 'false'){
			return true; // In editor
		}

		if (document.designMode === 'on'){
			return true; // Another kind of editor
		}

		return false;
	}

	/**
	* Is the element editable for any reason? Superset of isEditableWithNativeCaret() as it includes ARIA controls.
	* @param element
	* @return {boolean} true if editable for any reason, even ARIA widgets
	*/
	classifier.isEditable = function(element){
		if (classifier.isEditableWithNativeCaret(element)){
			return true;
		}

		// WAI-ARIA roles are JS widget hints, we need to pay attention to them as well
		var role = element.getAttribute('role');
		if (role){
			if (role.toLowerCase() === "textbox"){
				return true;
			}
		}
		return false;
	}

	classifier.isCheckable = function(element){
		var htmlElement = element;
		if (htmlElement.localName.toLowerCase() === 'input' && htmlElement.getAttribute('type') === 'checkbox'){
			return true;
		}

		// WAI-ARIA roles are JS widget hints, we need to pay attention to them as well
		var role = htmlElement.getAttribute('role');
		if (role){
			role = role.toLowerCase();
			if (role === "checkbox" || role === "menuitemcheckbox"){
				return true;
			}
		}

		var ariaCheckable = htmlElement.getAttribute('aria-checked');

		if (ariaCheckable){
			// Presence of aria-checkable in any way indicates the element is checkable
			return true;
		}

		return false;
	}

	// done
	callback();

});