package relations

import (
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
)

type RelationsStore interface {
	List() ([]*interfaces.RelationsRecord, error)
	ListByType(relationType string) ([]*interfaces.RelationsRecord, error)
	DeleteRelation(provider string, target string) error
	DeleteRelations(providerOrTarget string) error
	Save(relation interfaces.RelationsRecord) (*interfaces.RelationsRecord, error)
}
