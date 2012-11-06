// Misc utils

UIAElementNil.prototype.type = function() {
    return "UIAElementNil";
}

UIAElement.prototype.type = function() {
    var type = this.toString();
    return type.substring(8, type.length - 1);
}

UIAElement.prototype.hasChildren = function() {
    var type = this.type();
    // NOTE: UIALink can have UIAStaticText child
    return !(type === "UIAImage" || type === "UIAStaticText"
	    || type === "UIATextField" || type === "UIASecureTextField"
	    || type === "UIAButton" || type === "UIASwitch"
	    || type === "UIAElementNil" || type == "UIAElement");
}

UIAElement.prototype.matchesTagName = function(tagName) {
    var type = this.type();
    // ELEMENT, LINK, BUTTON, TEXT_FIELD, SECURE_TEXT_FIELD, TEXT
    if (tagName === "element")
	return true;
    if (tagName === "link")
	return type === "UIALink";
    if (tagName === "button")
	return type === "UIAButton";
    if (tagName === "textField")
	return type === "UIATextField";
    if (tagName === "secureTextField")
	return type === "UIASecureTextField";
    if (tagName === "staticText")
	return type === "UIAStaticText";
    throw new Error("add support for: " + tagName);
}

UIAElement.prototype.matchesTagNameAndText = function(tagName, text) {
    if (!this.matchesTagName(tagName))
	return false;
    var label = this.label();
    if (label)
	label = label.trim();
    if (label === text)
	return true;
    var name = this.name();
    if (name)
	name = name.trim();
    if (name === text)
	return true;
    var value = this.value();
    if (value)
	value = value.trim();
    return value === text;
}

// Finding elements

UIAElement.prototype.findElements = function(tagName) {
    var elements = new Array();
    var findElements = function(element, tagName) {
	var children = element.elements();
	var numChildren = children.length;
	for ( var i = 0; i < numChildren; i++) {
	    var child = children[i];
	    if (child.matchesTagName(tagName))
		elements.push(child);
	    if (child.hasChildren()) // big optimization
		findElements(child, tagName);
	}
    }
    findElements(this, tagName)
    return elements;
}

UIAElement.prototype.findElement = function(tagName, text) {
    var foundElement;
    var findElement = function(element, tagName, text) {
	var children = element.elements();
	var numChildren = children.length;
	for ( var i = 0; i < numChildren; i++) {
	    var child = children[i];
	    if (child.matchesTagNameAndText(tagName, text)) {
		foundElement = child;
		return;
	    }
	    if (child.hasChildren()) { // big optimization
		findElement(child, tagName, text);
		if (foundElement)
		    return;
	    }
	}
    }
    findElement(this, tagName, text)
    return foundElement;
}

UIAElement.prototype.findElementAndSetKey = function(tagName, text, key) {
    var foundElement = this.findElement(tagName, text);
    if (foundElement)
	elements[key] = foundElement;
    return foundElement;
}

// getPageSource

function tabSpacing(depth) {
    switch (depth) {
    case 0:
	return "";
    case 1:
	return "  ";
    case 2:
	return "    ";
    case 3:
	return "      ";
    case 4:
	return "        ";
    case 5:
	return "          ";
    }
    var space = "";
    for ( var i = 0; i < depth; i++)
	space += "  ";
    return space;
}

UIAElement.prototype.getPageSource = function() {
    var source = "";
    var appendPageSource = function(element, depth) {
	var children = element.elements();
	var numChildren = children.length;
	for ( var i = 0; i < numChildren; i++) {
	    var child = children[i];
	    appendElementSource(child, depth);
	    if (child.hasChildren()) // big optimization
		appendPageSource(child, depth + 1);
	}
    }
    var appendElementSource = function(element, depth) {
	source += tabSpacing(depth) + element.type() + ':'
	var label = element.label();
	var name = element.name();
	var value = element.value();
	if (label)
	    source += ' "' + label + '"';
	if (name)
	    source += ' NAME:"' + name + '"';
	if (value)
	    source += ' VALUE:"' + value + '"';
	source += '\n'
    }
    appendPageSource(this, 0)
    return source;
}