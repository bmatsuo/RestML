An XML vocabulary for specifying RESTful HTTP services.
An AngularJS directive DSL for laying out service documentation.

The goal of RestML is to support authenticated JSON and XML APIs.

##Features

- Specification of GET, PUT, POST, and DELETE actions.
- Specification of path, query, and form parameters
- API 'playground' with a variable Accept header type
request/response inspection.
- A completely customizable UI.

##Key differences from Swagger

XML based with an schema for validation and tooling. XML Schema is a W3C
standard with (possibly) man years of effort dedicated to tooling. Further,
XML Schema allows for documentation to be tied directly to the schema
version, making the integration experience smooth.

A simple DSL using AngularJS defines the UI. UI deployment is simple
(host a single html file). And (if you want it to be), everything is
completely customizable out of the box.

##Plans

- parameter/response model specification
- client-side parameter validation
- more types of parameters

##Model specification plans

- This is hard problem. Not sure how to solve it.

##Planned parameter types

- file
- `application/json`
- `application/xml`

##Potential plans for fancy response type handling

- `application/json`
- `application/xml`
- `text/csv`
- `image/*`
- `video/*`
