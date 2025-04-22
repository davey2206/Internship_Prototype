class Bounds {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  contains(item) {
    return (
      item.x >= this.x &&
      item.x < this.x + this.width &&
      item.y >= this.y &&
      item.y < this.y + this.height
    );
  }

  intersects(other) {
    return !(
      other.x >= this.x + this.width ||
      other.x + other.width <= this.x ||
      other.y >= this.y + this.height ||
      other.y + other.height <= this.y
    );
  }
}

export class Quadtree {
  constructor(bounds, maxItems, maxDepth, depth = 0) {
    this.bounds = new Bounds(bounds.x, bounds.y, bounds.width, bounds.height);
    this.maxItems = maxItems;
    this.maxDepth = maxDepth;
    this.items = [];
    this.nodes = null;
    this.depth = depth;
  }

  insert(item) {
    if (!this.bounds.contains(item)) {
      return false;
    }

    if (this.nodes) {
      const inserted = this.insertIntoChild(item);
      if (!inserted) {
        this.items.push(item);
      }
      return true;
    }

    this.items.push(item);

    if (this.items.length > this.maxItems && this.depth < this.maxDepth) {
      this.subdivide();
    }

    return true;
  }

  insertIntoChild(item) {
    for (let node of this.nodes) {
      if (node.bounds.contains(item)) {
        node.insert(item);
        return true;
      }
    }
    return false;
  }

  subdivide() {
    const halfWidth = this.bounds.width / 2;
    const halfHeight = this.bounds.height / 2;

    this.nodes = [
      new Quadtree(
        {
          x: this.bounds.x,
          y: this.bounds.y,
          width: halfWidth,
          height: halfHeight,
        },
        this.maxItems,
        this.maxDepth,
        this.depth + 1
      ),
      new Quadtree(
        {
          x: this.bounds.x + halfWidth,
          y: this.bounds.y,
          width: halfWidth,
          height: halfHeight,
        },
        this.maxItems,
        this.maxDepth,
        this.depth + 1
      ),
      new Quadtree(
        {
          x: this.bounds.x,
          y: this.bounds.y + halfHeight,
          width: halfWidth,
          height: halfHeight,
        },
        this.maxItems,
        this.maxDepth,
        this.depth + 1
      ),
      new Quadtree(
        {
          x: this.bounds.x + halfWidth,
          y: this.bounds.y + halfHeight,
          width: halfWidth,
          height: halfHeight,
        },
        this.maxItems,
        this.maxDepth,
        this.depth + 1
      ),
    ];

    // Redistribute existing items
    const itemsToRedistribute = this.items;
    this.items = [];

    for (let item of itemsToRedistribute) {
      this.insert(item);
    }
  }

  query(range) {
    const result = [];
    this.queryNode(
      new Bounds(range.x, range.y, range.width, range.height),
      result
    );
    return result;
  }

  queryNode(range, result) {
    if (!range.intersects(this.bounds)) {
      return;
    }

    for (let item of this.items) {
      if (range.contains(item)) {
        result.push(item);
      }
    }

    if (this.nodes) {
      for (let node of this.nodes) {
        node.queryNode(range, result);
      }
    }
  }
}
