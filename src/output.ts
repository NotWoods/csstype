import { EOL } from 'os';
import { DeclarableType, declarations, interfaces, isAliasProperty } from './declarator';
import { IGenerics, Type } from './typer';

export default () => ({
  flow: flow(),
  typescript: typescript(),
});

function flow() {
  let interfacesOutput = '';
  for (const item of interfaces) {
    if (interfacesOutput) {
      interfacesOutput += EOL + EOL;
    }

    const extendList = item.extends.map(extend => extend.name + stringifyGenerics(extend.generics, true)).join(', ');
    const isInterface = !!extendList;
    interfacesOutput += isInterface ? 'declare export interface ' : 'declare export type ';
    interfacesOutput += item.name + stringifyGenerics(item.generics);
    interfacesOutput += extendList ? ` extends ${extendList}` : '= ';
    interfacesOutput += '{' + EOL;

    for (const property of item.properties) {
      if (isAliasProperty(property)) {
        const generics = stringifyGenerics(property.generics, true);
        interfacesOutput += `${JSON.stringify(property.name)}?: ${
          item.fallback
            ? `${property.alias.name + generics} | ${property.alias.name + generics}[]${isInterface ? ';' : ','}`
            : property.alias.name + generics + (isInterface ? ';' : ',')
        }`;
      } else {
        const value = stringifyTypes(property.type);
        interfacesOutput += `${JSON.stringify(property.name)}?: ${
          item.fallback ? `${value} | ${value}[]${isInterface ? ';' : ','}` : value + (isInterface ? ';' : ',')
        }`;
      }

      interfacesOutput += EOL;
    }

    interfacesOutput += '}';
  }

  let declarationsOutput = '';
  for (const declaration of declarations) {
    if (declarationsOutput) {
      declarationsOutput += EOL + EOL;
    }

    declarationsOutput += 'declare ';

    if (declaration.export) {
      declarationsOutput += 'export ';
    }

    declarationsOutput += `type ${declaration.name + stringifyGenerics(declaration.generics, true)} = ${stringifyTypes(
      declaration.types,
    ) + EOL}`;
  }

  return `declare module "csstype" {${EOL + interfacesOutput + EOL + EOL + declarationsOutput + EOL}}`;
}

function typescript() {
  let interfacesOutput = '';
  for (const item of interfaces) {
    if (interfacesOutput) {
      interfacesOutput += EOL + EOL;
    }

    const extendList = item.extends.map(extend => extend.name + stringifyGenerics(extend.generics, true)).join(', ');
    interfacesOutput += 'export interface ' + item.name + stringifyGenerics(item.generics);

    if (extendList) {
      interfacesOutput += ` extends ${extendList}`;
    }

    interfacesOutput += '{' + EOL;

    for (const property of item.properties) {
      if (isAliasProperty(property)) {
        const generics = stringifyGenerics(property.generics, true);
        interfacesOutput += `${JSON.stringify(property.name)}?: ${
          item.fallback
            ? `${property.alias.name + generics} | ${property.alias.name + generics}[];`
            : `${property.alias.name + generics};`
        }`;
      } else {
        const value = stringifyTypes(property.type);
        interfacesOutput += `${JSON.stringify(property.name)}?: ${
          item.fallback ? `${value} | ${value}[];` : `${value};`
        }`;
      }

      interfacesOutput += EOL;
    }

    interfacesOutput += '}';
  }

  let declarationsOutput = '';
  for (const declaration of declarations) {
    if (declarationsOutput) {
      declarationsOutput += EOL + EOL;
    }

    if (declaration.export) {
      declarationsOutput += 'export ';
    }

    declarationsOutput += `type ${declaration.name + stringifyGenerics(declaration.generics, true)} = ${stringifyTypes(
      declaration.types,
    ) + EOL}`;
  }

  return interfacesOutput + EOL + EOL + declarationsOutput;
}

function stringifyTypes(types: DeclarableType | DeclarableType[]) {
  if (!Array.isArray(types)) {
    types = [types];
  }

  return types
    .map(type => {
      switch (type.type) {
        case Type.String:
          return 'string';
        case Type.Number:
          return 'number';
        case Type.StringLiteral:
          return JSON.stringify(type.literal);
        case Type.NumericLiteral:
          return type.literal;
        case Type.Alias:
          return type.name + stringifyGenerics(type.generics, true);
        case Type.Length:
          return 'TLength';
      }
    })
    .join(' | ');
}

function stringifyGenerics(items: IGenerics[] | undefined, ignoreDefault = false) {
  if (!items || items.length === 0) {
    return '';
  }

  return `<${items
    .map(({ name, defaults }) => (defaults && !ignoreDefault ? `${name} = ${defaults}` : name))
    .join(', ')}>`;
}
