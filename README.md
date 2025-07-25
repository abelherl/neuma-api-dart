![neuma-api-header](https://res.cloudinary.com/dp3fqnmmg/image/upload/v1752945996/GitHub_-_Neuma_API_Flutter_wdopwi.png)

## ✨ What is Neuma API Flutter?

**Neuma API Flutter** is a powerful VS Code extension designed to simplify your Flutter backend integration process by automatically creating folders and Dart files for you.

This extension is suitable for any Dart project. Although it is made to pair seamlessly with [Neuma Base Flutter](https://github.com/abelherl/neuma-base-flutter), this tool allows you to **generate Dart models instantly from JSON**.

Whether you’re building requests or parsing responses, **Neuma API Flutter** keeps your workflow rapid, consistent, and efficient.

## 💡 Features

* 🤖 Generate Dart models with one command
* 📁 Automatically create and manage folders
* 🧠 Smart type inference with nested class generation
* 📦 Support for arrays and objects of any depth
* 🎯 Choose between **Request** or **Response** generation
* 🔧 Additional [configurations for custom folders and generation settings](#configuration-options)

## 🚀 Getting Started
### 1. Install the Extension
Download the latest `.vsix` file from the [Releases](https://github.com/abelherl/neuma-api-flutter/releases) page. 

Then install via CLI:
```bash
code --install-extension neuma-api-flutter-x.x.x.vsix
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

## ⚙️ Configuration Options

You can customize how the extension generates your Dart models via the **VS Code settings UI** by searching for `Neuma API Flutter`. Below are the available options:

### 🔧 General Settings

| Setting               | Description                                                                         | Default           |
| --------------------- | ----------------------------------------------------------------------------------- | ----------------- |
| `Add Part Statement`  | Adds `part 'file.g.dart';` for code generation compatibility.                       | `false`           |
| `Default Base Folder` | Base path where models will be generated.                                           | `lib/data/models` |
| `Field Case`          | Controls naming style of fields. Options: `camelCase`, `snake_case`, or `original`. | `camelCase`       |

### 🧱 Model Structure

| Setting                    | Description                                                            | Default |
| -------------------------- | ---------------------------------------------------------------------- | ------- |
| `Generate Copy With`       | Adds a `copyWith()` method to generated classes.                       | `false` |
| `Generate Equatable`       | Extends `Equatable` for value equality (requires `equatable` package). | `false` |
| `Generate JSON Annotation` | Adds `@JsonKey()` decorators (requires `json_annotation`).             | `false` |
| `Generate Subfolders`      | Organizes output into subfolders per class name.                       | `true`  |
| `Generate To String`       | Adds a `toString()` override.                                          | `false` |

### 🛡️ Safety & Advanced

| Setting       | Description                                                 | Default    |
| ------------- | ----------------------------------------------------------- | ---------- |
| `Null Safety` | Handles nullability: `nullable`, `non-nullable`, or `auto`. | `auto`     |
| `Use Freezed` | Uses the `freezed` package instead of regular classes.      | `false`    |


Or add it directly in your `settings.json`:

```json
{
  "neuma-api-flutter.defaultBaseFolder": "lib/data/models",
  "neuma-api-flutter.fieldCase": "camelCase",
  "neuma-api-flutter.generateCopyWith": true,
  ...
}
```

## 🛠️ Future Plans
* ✅ Custom generation folder location
* ✅ Optional settings for ```copyWith(), Equatable, Freezed```, etc
* ⏳ Convert from Postman or Swagger JSON collection

## 📄 License
Licensed under the [MIT License](./LICENSE)
