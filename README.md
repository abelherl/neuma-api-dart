![neuma-api-header](https://res.cloudinary.com/dp3fqnmmg/image/upload/v1752945996/GitHub_-_Neuma_API_Flutter_wdopwi.png)

## ✨ What is Neuma API Flutter?

**Neuma API Flutter** is a powerful VS Code extension designed to simplify your Flutter backend integration process by automatically creating folders and Dart files for you.

This extension is suitable for any Dart project. Although it is made to pair seamlessly with [Neuma Base Flutter](https://github.com/abelherl/neuma-base-flutter), this tool allows you to **generate Dart models instantly from JSON**, complete with support for:

* `fromJson` and `toJson` for request and response
* Deeply nested classes
* CamelCase field conversion
* Freezed & Equatable (optional)
* ```copyWith()``` / ```toString()``` generation

Whether you’re building requests or parsing responses, **Neuma API Flutter** keeps your workflow rapid, consistent, and efficient.

## ⚙️ Features

* 🔧 Generate Dart models with one command
* 🧠 Smart type inference with nested class generation
* 📦 Support for arrays and objects of any depth
* 🎯 Choose between **Request** or **Response** generation
* 🧩 Optional: Freezed, JsonSerializable, Equatable, CopyWith

## 🚀 Getting Started
### 1. Install the Extension
Download the latest `.vsix` file from the [Releases](https://github.com/abelherl/neuma-api-flutter/releases) page. 

Then install via CLI:
```bash
code --install-extension neuma-api-dart-x.x.x.vsix
```

Or install it from VS Code:
1. Open VS Code
2. Press ```Ctrl+Shift+P``` (or ```Cmd+Shift+P``` on MacOS)
3. Type ```>Extensions: Install from VSIX```
4. Select the downloaded ```.vsix``` file

### 2. Use the Command
Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux), then run:

```
Neuma API: Convert JSON to Dart Model
```

You will be prompted to:

* Paste your JSON
* Choose **Request** or **Response**
* Enter a class name

The Dart model is automatically generated and copied to your clipboard! 🥳✨

## 📄 Example: Input & Output

### 🔁 Response Input
```json
{
  "id": 42,
  "title": "Sample Post",
  "author": {
    "id": 1,
    "name": "Jane Doe"
  },
  "tags": ["flutter", "dart"]
}
```

### ✅ Generated Dart (Response)
```dart
class SampleResponse {
  final int id;
  final String title;
  final SampleAuthorResponse author;
  final List<String> tags;

  const SampleResponse({
    required this.id,
    required this.title,
    required this.author,
    required this.tags,
  });

  factory SampleResponse.fromJson(Map<String, dynamic> json) {
    return SampleResponse(
      id: json['id'],
      title: json['title'],
      author: SampleAuthorResponse.fromJson(json['author']),
      tags: List<String>.from(json['tags']),
    );
  }
}

class SampleAuthorResponse {
  final int id;
  final String name;

  const SampleAuthorResponse({
    required this.id,
    required this.name,
  });

  factory SampleAuthorResponse.fromJson(Map<String, dynamic> json) {
    return SampleAuthorResponse(
      id: json['id'],
      name: json['name'],
    );
  }
}
```

### 📤 Request Input
```json
{
  "title": "Create New Post",
  "body": "This is the body of the new post",
  "tags": ["flutter", "api"]
}
```

### ✅ Generated Dart (Request)
```dart
class CreatePostRequest {
  final String title;
  final String body;
  final List<String> tags;

  const CreatePostRequest({
    required this.title,
    required this.body,
    required this.tags,
  });

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'body': body,
      'tags': tags,
    };
  }
}
```

### 📁 Folder Structure

You can customize the generation folder if you need to.

```
📁 lib/
├── 📁 models/
│   ├── 📁 create_post/
│   │   ├── create_post_request.dart
│   │   ├── create_post_response.dart
│   │── 📁 sample/
│   │   ├── sample_request.dart
│   │   ├── sample_response.dart
```

## 🛠️ Future Plans
* ⏳ Convert from Postman or Swagger JSON collection


## 📄 License
Licensed under the [MIT License](./LICENSE)
