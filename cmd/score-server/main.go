package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/fbs-tech-summit/score-server/pkg/score"
)

var version bool

func init() {
	flag.BoolVar(&version, "version", false, "print the version")
}

func main() {
	flag.Parse()

	if version {
		fmt.Println("version: 1.2.3-tech-summit-special")
		os.Exit(0)
	}

	log.Println("starting HTTP server")
	server := &score.PlayerServer{Store: score.NewInMemoryPlayerStore()}
	log.Fatal(http.ListenAndServe(":5800", server))
}
