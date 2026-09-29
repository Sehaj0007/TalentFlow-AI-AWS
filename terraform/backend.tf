terraform {
  backend "s3" {
    bucket       = "final-project-terraform-sehaj-2026"
    key          = "talentflow-ai/terraform.tfstate"
    region       = "eu-north-1"
    profile      = "terraform-deployer"
    encrypt      = true
    use_lockfile = true
  }
}