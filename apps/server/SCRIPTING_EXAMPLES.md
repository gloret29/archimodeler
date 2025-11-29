# Example Scripts for ArchiModeler

## Script 1: Find all Business Processes
```javascript
const processes = await model.findAll('BusinessProcess');
console.log(`Found ${processes.length} business processes`);
processes.forEach(p => console.log(`- ${p.name}`));
```

## Script 2: Find an element and its relationships
```javascript
const element = await model.findById('element-id-here');
console.log(`Element: ${element.name}`);

const relations = await element.getRelations(element.id);
console.log(`Has ${relations.length} relationships`);
```

## Script 3: Create a new element
```javascript
const newElement = await model.create({
  type: 'ApplicationComponent',
  name: 'New Application',
  properties: {
    description: 'Created by script',
    owner: 'IT Department'
  },
  modelPackageId: 'package-id-here'
});

console.log(`Created element: ${newElement.id}`);
```

## Script 4: Batch update elements
```javascript
const components = await model.findAll('ApplicationComponent');

for (const component of components) {
  if (!component.properties.owner) {
    await model.update(component.id, {
      properties: {
        ...component.properties,
        owner: 'Unassigned'
      }
    });
    console.log(`Updated ${component.name}`);
  }
}
```

## Script 5: Analyze relationships
```javascript
const actors = await model.findAll('BusinessActor');
let totalAssignments = 0;

for (const actor of actors) {
  const relations = await element.getRelations(actor.id, 'Assignment');
  totalAssignments += relations.length;
  console.log(`${actor.name}: ${relations.length} assignments`);
}

console.log(`Total assignments: ${totalAssignments}`);
```
