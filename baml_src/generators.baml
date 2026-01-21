// BAML Code Generation Configuration

generator target {
  // Output directory - project root, generates baml_client/ folder
  output_dir ".."
  // Output language
  output_type "typescript"
  // Version
  version "0.217.0"
  // Module format - use ESM for Vercel/Nitro compatibility
  module_format "esm"
}
