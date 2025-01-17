// A module for the ScoreServer pipeline
/*
Step 0:
  This module has been generated by running:
    dagger init --name score-server --sdk typescript --source .forge

  The first line in this comment block is a short description line and the
  rest is a long description that details the module's purpose or usage.
  All modules should have a short description.

  In general, comments are used to document all functions, parameters, etc.
*/

import { dag, Container, Directory, Secret, object, func, argument, Service } from "@dagger.io/dagger"

/*
  Step 1:
    This index.ts file is our entrypoint into our pipeline - it is a Dagger module, and you can think of it as the replacement for your Jenkinsfile.

    Each method on the ScoreServer class is a Dagger function within the module, that you can call programmatically, or through the CLI.

    You can see all the functions for this module by running:
      dagger functions -m .forge
*/

@object()
class ScoreServer {

  /*
    Step 2:
      Let's start by looking at this Test Dagger function. As you can see, there is only a single argument for this module,
      which is a directory variable called src, which has a default path in the root of the repo.

      To see how these input parameters are used, run:
        dagger call -m .forge test --help

      Let's quickly break down the syntax of that command:
        dagger call: call a dagger function - in this case "test"
        -m .forge: the function belongs to the "forge" module, which is the .forge directory this file is inside
        test: the name of the function to call
        --help: returns helpful information about the parameters that the function accepts
   */

  /**
   * Test the score-server project using staticcheck, go vet and go test
   */
  @func()
  async test(
    @argument({ defaultPath: "/", ignore: [".forge"] }) src: Directory) {

    /*
      Step 3:
        Here we are calling our first Dagger module - the "Golang" module, which has been imported from https://github.com/fastly/forge/tree/main/dagger-modules/standard/golang
        Modules are imported using `dagger install <path to module>`.
        These modules can be shared across programming languages - a module written in Go can be imported and used in a Typescript pipeline, like this one!
    */
    let goProject = dag.golang(src)

    /*
      Step 4:
        Let's run go vet against our project.
    */
    let vetResult = await goProject.vet();
    if (vetResult !== "") {
      throw new Error(`Go vet results: ${vetResult}`);
    }

    /*
      Step 5:
        Now we've read some code - let's try it out!

        From the root directory or the repo, run:
          dagger call -m .forge test
    */

    /*
      Step 6:
        Let's add some Go tests and vetting to this module - uncomment the block of code below:
    */

    /*
    let staticCheckResult = await goProject.check()

    // If staticcheck returns anything other than an empty string, then it has failed - so let's throw an error.
    if (staticCheckResult != "") {
      throw new Error(`Static check results: ${staticCheckResult}`);
    }

    // Run go test on the project with explicit options
    let testResult = await goProject.test({
      args: ["-race"],
    });
    console.log(`Test results: ${testResult}`);
    */

    /*
    Step 7:
      It looks like our tests are failing. One of the tests is expecting a config file, but it isn't present.

      With Jenkins you would need to enter the "Push and Pray" anti-pattern right about now, where you start
      pushing commits to change things and then wait for CI to run hopefully pass.

      Dagger has a better way - let's re-run the test module with the --interactive flag:
        dagger --interactive call -m .forge test

      Now dagger has dropped us into an interactive shell at the exact point in the pipeline where an error occurred.
      We can re-run the last-command to debug it:
        go test -race ./...
      If we run `ls`, we can see that we have a `/src/config.yml` file, where the test is expecting `/src/config.yaml`

      Let's rename `config.yml` to `config.yaml`, and the tests should pass.
        mv config.yml config.yaml
        go test -race ./...

      Now that we have confirmed it is fixed. We need to replicate this in our source code.
      The above only happened in the containerised pipeline:
        git mv config.yml config.yaml
    */

    // Tests passed!
  }

  /*
    Step 8:
      Now we've got our test function written, let's build a Docker image for our score-server package.
 */

  /**
   * Build and optionally publish a Docker image for the score-server package
   */
  @func()
  async docker(
    @argument({ defaultPath: "/", ignore: [".forge"] }) src: Directory, token?: Secret):
    Promise<Container> {
    /*
      Step 9:
        Let's start by re-using our test function from earlier, so we know the code is valid before building it into a Docker image.
    */
    await this.test(src);

    /*
      Step 10:
        Now let's use the Build method in the Golang module to get our Go binary, ready for packaging into a Docker image.
    */
    let bin = dag.golang(src).build({
      os: "linux",   // Build for a specific Os.
      arch: "amd64", // Build for a specific architecture.
      static: true,  // Static linking.
      args: [],      // Extra build parameters
    });

    /*
      Step 11:
        Here we define an entrypoint for our container, and then build a Docker image that contains our Go binary. We then return the dagger Container type.

        Let's run this module and see how it looks:
      dagger call -m .forge docker
    */
    let entrypoint = ["./score-server"];
    let image = dag.docker({
      os: "linux", // Build image for specific os
      arch: "amd64", // Build image for specific architecture
    }).package_(bin, entrypoint);

    /*
      Step 12:
        You can see that Dagger prints some helpful information about the container. Let's explore the Dagger CLI a little more, before we continue with the module development.

        Run the command again, with the --help flag appended to the end. You'll see that Dagger has a powerful CLI and we have lots of options available to us with our Docker image.

        Let's jump into the container that our module returns and have a poke around. Run:
          dagger call -m .forge docker terminal

        We can check our Go binary is working correctly:
          ./score-server --version

        Run `exit` to escape the container
    */

    /*
      Step 13:
        Let's tag our container with the Git SHA and publish it to Harbor.
        
        Set up your vault token by running these commands:
          export VAULT_ADDR=https://infra-secrets.prd.k8s.secretcdn.net/
          export VAULT_TOKEN=$(vault login -format json -method=oidc | jq -r .auth.client_token)

        Next, uncomment the code block below.

        Now you can run the module again, this time you'll need to pass in --token:
          dagger call -m .forge docker --token=VAULT_TOKEN

        You should see your container has been scanned and published to https://container-registry.secretcdn.net/harbor/projects/4322/repositories/score-server/artifacts-tab
   */

    /*
    if (!token) {
      console.log("No vault token provided - skipping image publishing");
      return image.container();
    }

    // Retrieve the git commit of the running pipeline, so we can tag the image with it.
    let sha = await dag.localGit(src).commit({
      short: true,
      ignoreDirty: true,
    });
    
    let repoName = await dag.localGit(src).repoName();

    // Customise the image definition
    image = image.withName("playground/score-server").withTags([repoName + "-" + sha]);

    await image.publish({
      registryType: "harbor",
      secretBackendType: "vault",
      token: token,
      useSandbox: false,
    });
     */

    /*
      Step 14:
        Let's update the pipeline to publish to the fastly namespace in Harbor if we're merging to main.
        When publishing to the fastly namespace, containers are also signed.

        We can insert this code directly ABOVE our image.Publish() call, to check the branch using the LocalGit module and
        modify the image path.

        const branch = await dag.localGit(src).branch();
        if (!branch) {
          throw new Error("Error retrieving branch");
        }

        if (branch == "main") {
          image = image.withName("fastly/score-server")
        }
   */

    return image.container();
  }

  /*
    Step 15:
    Now we have our score-server tested and producing a docker image, let's get it running and see what it does.
  */

  /**
   * Run the score-server project as a service
   */
  @func()
  async service(
    @argument({ defaultPath: "/", ignore: [".forge"] }) src: Directory
  ): Promise<Service> {
    /*
      Step 16:
        Let's re-use our docker function, we already know it gives us a tested, vetted, and staticchecked container image!
    */
    let ctr = await this.docker(src);

    /*
      Step 17:
        Now we can expose the score-server port to the host, and simply return it as a dagger Service type.

        Let's see what options the dagger Service type exposes. Run:
          dagger call -m .forge service --help

        Now let's start the service and interact with it. Run:
          dagger call -m .forge service up

        You now have the server running and exposed to your host machine - open a new terminal window and run these requests:
          curl -X POST http://localhost:5800/players/robert
          curl http://localhost:5800/players/robert

        You should get a number back for every time you POST to a player. Try it out!

        These services are extremely powerful, not just for local development workflows, but for programmatic integration testing.
        If you have used Devly, you will enjoy working with Dagger services: https://docs.dagger.io/manuals/developer/services/#service-containers
    */

    return ctr.withExposedPort(5800).asService();
  }
}

/*
  Step 18:
    Open .github/workflows/forge.yaml
 */
